import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import type { NetworkLink } from '../types';
import type { NetworkNode } from '../types';

interface NetworkVisualizationProps {
  nodes: NetworkNode[];
  links: NetworkLink[];
  highlightedCharacter: string | null;
  onCharacterClick: (character: string) => void;
  width: number;
  height: number;
}

export const NetworkVisualization: React.FC<NetworkVisualizationProps> = ({
  nodes,
  links,
  highlightedCharacter,
  onCharacterClick,
  width,
  height
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<NetworkNode, NetworkLink> | null>(null);
  const previousNodesRef = useRef<NetworkNode[]>([]);

  // Generate unique colors for each character using a large color palette
  const generateUniqueColors = useMemo(() => {
    const colors = [
      '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
      '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43',
      '#10ac84', '#ee5253', '#0abde3', '#3742fa', '#2ed573',
      '#ff5722', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3',
      '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a',
      '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722',
      '#795548', '#607d8b', '#e91e63', '#f44336', '#ff4081',
      '#c51162', '#aa00ff', '#6200ea', '#3d5afe', '#2979ff',
      '#00b0ff', '#00e5ff', '#1de9b6', '#00e676', '#76ff03',
      '#c6ff00', '#ffea00', '#ffc400', '#ff9100', '#ff3d00'
    ];
    
    return (nodeIndex: number) => {
      return colors[nodeIndex % colors.length];
    };
  }, []);

  // Smooth auto-fit function with improved calculations
  const autoFitGraph = useCallback((svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, immediate: boolean = false) => {
    if (nodes.length === 0) return;

    const delay = immediate ? 100 : 1000;
    
    setTimeout(() => {
      // Calculate bounding box of all nodes with text consideration
      const nodePositions = nodes.map(node => {
        const textWidth = (node.name.length * 8) + 20; // Approximate text width
        const effectiveRadius = Math.max(node.radius, textWidth / 2);
        return { 
          x: node.x || 0, 
          y: node.y || 0, 
          radius: effectiveRadius + 20 // Extra padding for text
        };
      });
      
      const minX = Math.min(...nodePositions.map(n => n.x - n.radius));
      const maxX = Math.max(...nodePositions.map(n => n.x + n.radius));
      const minY = Math.min(...nodePositions.map(n => n.y - n.radius));
      const maxY = Math.max(...nodePositions.map(n => n.y + n.radius));
      
      const contentWidth = maxX - minX || 100;
      const contentHeight = maxY - minY || 100;
      const contentCenterX = (minX + maxX) / 2;
      const contentCenterY = (minY + maxY) / 2;
      
      // Calculate scale to fit content with generous padding
      const padding = 80;
      const scaleX = (width - 2 * padding) / contentWidth;
      const scaleY = (height - 2 * padding) / contentHeight;
      const scale = Math.min(scaleX, scaleY, 1.5); // Allow more zoom for better readability
      
      // Calculate translation to center content
      const translateX = width / 2 - contentCenterX * scale;
      const translateY = height / 2 - contentCenterY * scale;
      
      // Apply smooth transition
      const zoom = d3.zoom<SVGSVGElement, unknown>();
      const duration = immediate ? 500 : 1500;
      
      svg.transition()
        .duration(duration)
        .ease(d3.easeQuadInOut)
        .call(
          zoom.transform,
          d3.zoomIdentity.translate(translateX, translateY).scale(scale)
        );
    }, delay);
  }, [nodes, width, height]);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    const isFirstRender = previousNodesRef.current.length === 0;
    const isNewData = nodes.length !== previousNodesRef.current.length;

    // Only clear if it's a completely new dataset
    if (isFirstRender) {
      svg.selectAll("*").remove();
    }

    // Create or select main group for zoom/pan
    let g = svg.select<SVGGElement>('g.main-group');
    if (g.empty()) {
      g = svg.append("g").attr("class", "main-group");
    }

    // Enhanced zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 10])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    if (isFirstRender) {
      svg.call(zoom);
    }

    // Create or update defs for gradients and filters
    let defs = svg.select<SVGDefsElement>('defs');
    if (defs.empty()) {
      defs = svg.append("defs");
    }

    // Enhanced glow filter
    let glowFilter = defs.select<SVGFilterElement>('#glow');
    if (glowFilter.empty()) {
      glowFilter = defs.append("filter")
        .attr("id", "glow")
        .attr("x", "-100%")
        .attr("y", "-100%")
        .attr("width", "300%")
        .attr("height", "300%");

      glowFilter.append("feGaussianBlur")
        .attr("stdDeviation", "4")
        .attr("result", "coloredBlur");

      const glowMerge = glowFilter.append("feMerge");
      glowMerge.append("feMergeNode").attr("in", "coloredBlur");
      glowMerge.append("feMergeNode").attr("in", "SourceGraphic");
    }

    // Create unique gradients for each character
    nodes.forEach((node, index) => {
      const gradientId = `gradient-${node.id}`;
      let gradient = defs.select<SVGRadialGradientElement>(`#${gradientId}`);
      
      if (gradient.empty()) {
        gradient = defs.append("radialGradient")
          .attr("id", gradientId)
          .attr("cx", "30%")
          .attr("cy", "30%")
          .attr("r", "70%");
      }

      const baseColor = generateUniqueColors(index);
      
      gradient.selectAll("stop").remove();
      gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", d3.color(baseColor)!.brighter(0.8).toString());
      
      gradient.append("stop")
        .attr("offset", "70%")
        .attr("stop-color", baseColor);
      
      gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", d3.color(baseColor)!.darker(0.5).toString());
    });

    // Enhanced simulation with better forces
    const simulation = d3.forceSimulation<NetworkNode>(nodes)
      .force("link", d3.forceLink<NetworkNode, NetworkLink>(links)
        .id(d => d.id)
        .distance(d => Math.max(100, 180 - d.weight * 6))
        .strength(d => Math.min(0.9, d.weight / 15)))
      .force("charge", d3.forceManyBody<NetworkNode>()
        .strength(() => -1000)
        .distanceMin(40)
        .distanceMax(400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide<NetworkNode>()
        .radius(d => Math.max(d.radius + 40, (d.name.length * 4) + 30))
        .strength(0.8))
      .force("x", d3.forceX(width / 2).strength(0.03))
      .force("y", d3.forceY(height / 2).strength(0.03));

    simulationRef.current = simulation;

    // Enhanced links with better styling
    const linkSelection = g.selectAll<SVGLineElement, NetworkLink>("line.link")
      .data(links, (d: NetworkLink) => `${(d.source as NetworkNode).id || d.source}-${(d.target as NetworkNode).id || d.target}`);

    // Remove old links
    linkSelection.exit()
      .transition()
      .duration(500)
      .attr("stroke-opacity", 0)
      .remove();

    // Add new links
    const linkEnter = linkSelection.enter()
      .append("line")
      .attr("class", "link")
      .attr("stroke-opacity", 0);

    // Update all links
    linkEnter.merge(linkSelection)
      .transition()
      .duration(800)
      .attr("stroke", d => {
        const intensity = Math.min(1, d.weight / 15);
        return d3.interpolateRgb("rgba(150, 150, 150, 0.3)", "rgba(255, 255, 255, 0.8)")(intensity);
      })
      .attr("stroke-width", d => Math.max(1.5, d.strokeWidth * 0.9))
      .attr("stroke-opacity", 0.7)
      .attr("stroke-linecap", "round")
      .style("filter", "url(#glow)");

    // Enhanced nodes with smooth updates
    const nodeSelection = g.selectAll<SVGGElement, NetworkNode>("g.node")
      .data(nodes, (d: NetworkNode) => d.id);

    // Remove old nodes
    nodeSelection.exit()
      .transition()
      .duration(500)
      .attr("transform", "scale(0)")
      .style("opacity", 0)
      .remove();

    // Add new nodes
    const nodeEnter = nodeSelection.enter()
      .append("g")
      .attr("class", "node")
      .style("cursor", "pointer")
      .attr("transform", "scale(0)")
      .style("opacity", 0);

    // Add glow circle for each new node
    nodeEnter.append("circle")
      .attr("class", "glow-circle")
      .attr("fill", (_, i) => generateUniqueColors(i))
      .attr("opacity", 0.2)
      .style("filter", "blur(3px)");

    // Add main circle for each new node
    nodeEnter.append("circle")
      .attr("class", "main-circle")
      .attr("stroke", "rgba(255, 255, 255, 0.9)")
      .attr("stroke-width", 2.5)
      .style("filter", "drop-shadow(0px 4px 12px rgba(0,0,0,0.6))");

    // Add text for each new node
    nodeEnter.append("text")
      .attr("class", "node-text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("fill", "white")
      .attr("font-weight", "700")
      .attr("font-family", "'Segoe UI', 'Roboto', sans-serif")
      .style("text-shadow", "0px 0px 8px rgba(0,0,0,0.9), 0px 2px 4px rgba(0,0,0,0.8)")
      .style("pointer-events", "none");

    // Add tooltip for each new node
    nodeEnter.append("title");

    // Update all nodes (new + existing)
    const nodeUpdate = nodeEnter.merge(nodeSelection);

    // Animate new nodes in
    nodeEnter
      .transition()
      .duration(800)
      .delay((_, i) => i * 50) // Stagger animation
      .attr("transform", "scale(1)")
      .style("opacity", 1);

    // Update glow circles
    nodeUpdate.select<SVGCircleElement>(".glow-circle")
      .transition()
      .duration(600)
      .attr("r", d => d.radius + 6)
      .attr("fill", (_, i) => generateUniqueColors(i));

    // Update main circles
    nodeUpdate.select<SVGCircleElement>(".main-circle")
      .transition()
      .duration(600)
      .attr("r", d => d.radius)
      .attr("fill", d => `url(#gradient-${d.id})`);

    // Update text - ALWAYS show full character name
    nodeUpdate.select<SVGTextElement>(".node-text")
      .transition()
      .duration(600)
      .attr("font-size", d => {
        // Calculate font size based on both radius and name length
        const baseSize = Math.max(9, Math.min(16, d.radius / 4));
        const lengthAdjustment = Math.max(0.7, 1 - (d.name.length / 30));
        return Math.max(8, baseSize * lengthAdjustment);
      })
      .text(d => d.name); // Always show complete name

    // Update tooltips
    nodeUpdate.select<SVGTitleElement>("title")
      .text(d => `${d.name}\n📊 Mentions: ${d.mentions}\n⭐ Importance: ${d.importance}/5`);

    // Enhanced interactions
    nodeUpdate
      .on("click", (_, d) => {
        onCharacterClick(d.name);
      })
      .on("mouseover", function(_, d) {
        const node = d3.select(this);
        
        node.select<SVGCircleElement>(".main-circle")
          .transition()
          .duration(200)
          .attr("r", d.radius * 1.2)
          .attr("stroke-width", 4)
          .style("filter", "drop-shadow(0px 6px 20px rgba(255,255,255,0.3)) url(#glow)");
        
        node.select<SVGCircleElement>(".glow-circle")
          .transition()
          .duration(200)
          .attr("r", (d.radius + 6) * 1.2)
          .attr("opacity", 0.4);

        // Highlight connected links
        g.selectAll<SVGLineElement, NetworkLink>("line.link")
          .filter((l: NetworkLink) => (l.source as NetworkNode).id === d.id || (l.target as NetworkNode).id === d.id)
          .transition()
          .duration(200)
          .attr("stroke-opacity", 1)
          .attr("stroke-width", (l: NetworkLink) => Math.max(3, l.strokeWidth * 1.5))
          .attr("stroke", "rgba(255, 255, 255, 0.9)");
      })
      .on("mouseout", function(_, d) {
        const node = d3.select(this);
        
        node.select<SVGCircleElement>(".main-circle")
          .transition()
          .duration(200)
          .attr("r", d.radius)
          .attr("stroke-width", 2.5)
          .style("filter", "drop-shadow(0px 4px 12px rgba(0,0,0,0.6))");
        
        node.select<SVGCircleElement>(".glow-circle")
          .transition()
          .duration(200)
          .attr("r", d.radius + 6)
          .attr("opacity", 0.2);

        // Reset link highlighting
        g.selectAll<SVGLineElement, NetworkLink>("line.link")
          .transition()
          .duration(200)
          .attr("stroke-opacity", 0.7)
          .attr("stroke-width", (l: NetworkLink) => Math.max(1.5, l.strokeWidth * 0.9))
          .attr("stroke", (l: NetworkLink) => {
            const intensity = Math.min(1, l.weight / 15);
            return d3.interpolateRgb("rgba(150, 150, 150, 0.3)", "rgba(255, 255, 255, 0.8)")(intensity);
          });
      })
      .call(d3.drag<SVGGElement, NetworkNode>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Enhanced simulation tick function
    simulation.on("tick", () => {
      g.selectAll<SVGLineElement, NetworkLink>("line.link")
        .attr("x1", (d: NetworkLink) => (d.source as NetworkNode).x!)
        .attr("y1", (d: NetworkLink) => (d.source as NetworkNode).y!)
        .attr("x2", (d: NetworkLink) => (d.target as NetworkNode).x!)
        .attr("y2", (d: NetworkLink) => (d.target as NetworkNode).y!);

      g.selectAll<SVGGElement, NetworkNode>("g.node")
        .attr("transform", (d: NetworkNode) => {
          // Enhanced boundary constraints
          const margin = Math.max(d.radius + 30, (d.name.length * 3) + 20);
          d.x = Math.max(margin, Math.min(width - margin, d.x!));
          d.y = Math.max(margin, Math.min(height - margin, d.y!));
          return `translate(${d.x},${d.y})`;
        });
    });

    // Auto-fit after updates with smooth animation
    autoFitGraph(svg, isNewData);

    function dragstarted(event: d3.D3DragEvent<SVGGElement, NetworkNode, NetworkNode>, d: NetworkNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, NetworkNode, NetworkNode>, d: NetworkNode) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGGElement, NetworkNode, NetworkNode>, d: NetworkNode) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = undefined;
      d.fy = undefined;
    }

    // Store current nodes for next render comparison
    previousNodesRef.current = [...nodes];

    return () => {
      simulation.stop();
    };
  }, [nodes, links, width, height, onCharacterClick, autoFitGraph, generateUniqueColors]);

  // Enhanced highlighting effects
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    
    // Reset all styling
    svg.selectAll<SVGCircleElement, unknown>('.main-circle')
      .transition()
      .duration(300)
      .attr('stroke', 'rgba(255, 255, 255, 0.9)')
      .attr('stroke-width', 2.5)
      .style('filter', 'drop-shadow(0px 4px 12px rgba(0,0,0,0.6))');
    
    svg.selectAll<SVGLineElement, unknown>('line.link')
      .transition()
      .duration(300)
      .attr('stroke-opacity', 0.7);

    if (highlightedCharacter) {
      // Highlight selected character with vibrant effects
      svg.selectAll<SVGGElement, NetworkNode>('g.node')
        .filter((d: NetworkNode) => d.name === highlightedCharacter)
        .select<SVGCircleElement>('.main-circle')
        .transition()
        .duration(300)
        .attr('stroke', '#ff4757')
        .attr('stroke-width', 5)
        .style('filter', 'drop-shadow(0px 8px 24px rgba(255, 71, 87, 0.8)) url(#glow)');

      // Highlight connected links
      svg.selectAll<SVGLineElement, NetworkLink>('line.link')
        .filter((d: NetworkLink) => 
          (d.source as NetworkNode).name === highlightedCharacter || (d.target as NetworkNode).name === highlightedCharacter)
        .transition()
        .duration(300)
        .attr('stroke-opacity', 1)
        .attr('stroke', '#ff4757')
        .attr('stroke-width', (d: NetworkLink) => Math.max(3, d.strokeWidth * 2));

      // Highlight connected characters
      const connectedCharacters = links
        .filter(link => 
          (link.source as NetworkNode).name === highlightedCharacter || 
          (link.target as NetworkNode).name === highlightedCharacter)
        .map(link => 
          (link.source as NetworkNode).name === highlightedCharacter ? 
          (link.target as NetworkNode).name : 
          (link.source as NetworkNode).name);

      svg.selectAll<SVGGElement, NetworkNode>('g.node')
        .filter((d: NetworkNode) => connectedCharacters.includes(d.name))
        .select<SVGCircleElement>('.main-circle')
        .transition()
        .duration(300)
        .attr('stroke', '#ffa502')
        .attr('stroke-width', 4)
        .style('filter', 'drop-shadow(0px 6px 16px rgba(255, 165, 2, 0.6)) url(#glow)');
    }
  }, [highlightedCharacter, links]);

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ 
        background: '#000000',
        borderRadius: '12px',
        cursor: 'grab',
        overflow: 'visible',
        border: '1px solid #333',
        maxWidth: '100%',
        maxHeight: '100%'
      }}
    />
  );
};