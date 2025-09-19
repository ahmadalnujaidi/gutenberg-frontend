import { useState, useCallback } from 'react';
import type { AnalysisResult, NetworkNode, NetworkLink } from '../types';

export const useNetworkData = () => {
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [links, setLinks] = useState<NetworkLink[]>([]);
  const [highlightedCharacter, setHighlightedCharacter] = useState<string | null>(null);

  // Enhanced color palette with many unique colors
  const colorPalette = [
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

  const updateData = useCallback((data: AnalysisResult) => {
    if (!data?.characters || !data?.interactions) return;

    // Filter characters with sufficient mentions
    const filteredCharacters = data.characters.filter(char => char.mentions >= 2);
    const characterMap = new Map();

    // Create enhanced node objects with unique colors
    const newNodes: NetworkNode[] = filteredCharacters.map((char, index) => {
      const importance = Math.min(5, Math.ceil(char.mentions / 5));
      const node: NetworkNode = {
        id: char.name,
        name: char.name,
        mentions: char.mentions,
        description: char.description,
        radius: Math.max(30, Math.min(60, 20 + Math.sqrt(char.mentions) * 6)), // Slightly larger for better text display
        importance,
        color: colorPalette[index % colorPalette.length] // Ensure unique colors
      };
      characterMap.set(char.name, node);
      return node;
    });

    // Filter and create links
    const validInteractions = data.interactions.filter(interaction => 
      characterMap.has(interaction.source) && 
      characterMap.has(interaction.target) &&
      interaction.weight >= 2
    );

    const newLinks: NetworkLink[] = validInteractions.map(interaction => ({
      source: interaction.source,
      target: interaction.target,
      weight: interaction.weight,
      contexts: interaction.contexts,
      strokeWidth: Math.max(2, Math.min(10, Math.sqrt(interaction.weight) * 2.5))
    }));

    setNodes(newNodes);
    setLinks(newLinks);
  }, []);

  const highlightCharacter = useCallback((characterName: string | null) => {
    setHighlightedCharacter(characterName);
  }, []);

  const getCharacterInteractions = useCallback(() => {
    const interactionMap = new Map<string, Map<string, number>>();
    
    // Initialize all characters
    nodes.forEach(node => {
      interactionMap.set(node.name, new Map());
    });

    // Process interactions (bidirectional)
    links.forEach(link => {
      const sourceName = typeof link.source === 'string' ? link.source : link.source.name;
      const targetName = typeof link.target === 'string' ? link.target : link.target.name;
      
      const sourceMap = interactionMap.get(sourceName);
      const targetMap = interactionMap.get(targetName);
      
      if (sourceMap && targetMap) {
        sourceMap.set(targetName, (sourceMap.get(targetName) || 0) + link.weight);
        targetMap.set(sourceName, (targetMap.get(sourceName) || 0) + link.weight);
      }
    });

    // Convert to sorted array format
    return Array.from(interactionMap.entries()).map(([character, interactions]) => {
      const totalInteractions = Array.from(interactions.values()).reduce((sum, weight) => sum + weight, 0);
      const sortedPartners = Array.from(interactions.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8);

      return {
        character,
        totalInteractions,
        partners: sortedPartners
      };
    }).sort((a, b) => b.totalInteractions - a.totalInteractions);
  }, [nodes, links]);

  return {
    nodes,
    links,
    highlightedCharacter,
    updateData,
    highlightCharacter,
    getCharacterInteractions
  };
};