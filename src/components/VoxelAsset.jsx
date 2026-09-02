import React from 'react';

const PALETTE = {
  gold: '#f5c542',
  teal: '#54d6c7',
  wood: '#6b4528',
  stone: '#59616a',
  shadow: '#182126',
  light: '#d9e5df',
};

export function VoxelAsset({ type = 'block', size = 44, tone = 'stone', label }) {
  const color = PALETTE[tone] || tone;
  const common = { width: size, height: size, display: 'block', imageRendering: 'pixelated' };
  if (type === 'player') return <svg aria-label={label || 'Player'} role="img" viewBox="0 0 48 64" style={common}><path fill={PALETTE.shadow} d="M10 2h28v20H10zM6 22h36v28H6zM10 50h10v12H10zM28 50h10v12H28z"/><path fill={color} d="M14 6h20v14H14zM12 26h24v19H12z"/><path fill={PALETTE.light} d="M17 11h4v4h-4zM27 11h4v4h-4z"/></svg>;
  if (type === 'armor') return <svg aria-label={label || 'Armor'} role="img" viewBox="0 0 32 32" style={common}><path fill={PALETTE.shadow} d="M8 3h16l4 8-4 3v14H8V14l-4-3z"/><path fill={color} d="M10 6h12l3 6-4 2v10H11V14l-4-2z"/></svg>;
  if (type === 'tool') return <svg aria-label={label || 'Tool'} role="img" viewBox="0 0 32 32" style={common}><path fill={PALETTE.shadow} d="M18 3h5v17h-5zM5 17h25v6H5z"/><path fill={color} d="M19 5h3v16h-3zM7 18h21v3H7z"/></svg>;
  if (type === 'chest') return <svg aria-label={label || 'Chest'} role="img" viewBox="0 0 32 32" style={common}><path fill={PALETTE.shadow} d="M3 9h26v19H3zM5 5h22v8H5z"/><path fill={color} d="M6 11h20v13H6z"/><path fill={PALETTE.gold} d="M14 15h4v6h-4z"/></svg>;
  return <svg aria-label={label || 'Block'} role="img" viewBox="0 0 32 32" style={common}><path fill={PALETTE.shadow} d="M4 8 16 2l12 6v16l-12 6L4 24z"/><path fill={color} d="m7 9 9-4 9 4-9 4zM7 11l9 4v11l-9-4zM25 11l-9 4v11l9-4z"/><path fill="#ffffff" opacity=".14" d="m7 9 9-4 9 4-9 4z"/></svg>;
}

export function VoxelIcon({ name, size = 18, label }) {
  const type = name.includes('armor') ? 'armor' : name.includes('tool') ? 'tool' : name.includes('chest') ? 'chest' : name.includes('player') ? 'player' : 'block';
  const tone = name.includes('gold') || name.includes('build') ? 'gold' : name.includes('wood') ? 'wood' : name.includes('ui') ? 'teal' : 'stone';
  return <VoxelAsset type={type} tone={tone} size={size} label={label || name} />;
}
