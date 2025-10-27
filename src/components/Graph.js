import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './Graph.css';

function Graph({ notes, onSelectNote }) {
  const svgRef = useRef();

  useEffect(() => {
    if (!svgRef.current || notes.length === 0) return;

    // Prepare nodes from all notes
    const nodes = notes.map(note => ({
      id: note.id,
      title: note.title || 'Untitled'
    }));

    // Create links from actual linkedNotes data
    const links = [];
    notes.forEach(note => {
      if (note.linkedNotes && note.linkedNotes.length > 0) {
        note.linkedNotes.forEach(linkedNoteId => {
          if (nodes.find(n => n.id === linkedNoteId)) {
            links.push({
              source: note.id,
              target: linkedNoteId
            });
          }
        });
      }
    });

    // Get dimensions
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Create a group for transformations (zoom/pan)
    const g = svg.append('g');

    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links)
        .id(d => d.id)
        .distance(150))
      .force('charge', d3.forceManyBody().strength(-500))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(50));

    // Create arrow markers for directed links
    const defs = svg.append('defs');
    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('markerWidth', 10)
      .attr('markerHeight', 10)
      .attr('refX', 28)
      .attr('refY', 3)
      .attr('orient', 'auto')
      .append('polygon')
      .attr('points', '0 0, 10 3, 0 6')
      .attr('fill', '#6366f1');

    // Create link lines with arrows
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#4b5563')
      .attr('stroke-width', 2)
      .attr('opacity', 0.6)
      .attr('marker-end', 'url(#arrowhead)');

    // Create nodes
    const node = g.append('g')
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', 20)
      .attr('fill', '#6366f1')
      .attr('opacity', 0.8)
      .on('click', (event, d) => {
        console.log('🔵 Node clicked:', d);
        console.log('Looking for note with id:', d.id);
        console.log('Available notes:', notes.map(n => ({ id: n.id, title: n.title })));
        
        if (onSelectNote) {
          const noteToSelect = notes.find(n => n.id === d.id);
          console.log('Note to select:', noteToSelect);
          if (noteToSelect) {
            onSelectNote(noteToSelect);
            console.log('✅ Selected note:', noteToSelect.title);
          } else {
            console.log('❌ Note not found in notes array');
          }
        } else {
          console.log('❌ onSelectNote callback not provided');
        }
      })
      .call(drag(simulation));

    // Add labels
    const labels = g.append('g')
      .selectAll('text')
      .data(nodes)
      .enter()
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.3em')
      .attr('font-size', '12px')
      .attr('fill', '#ffffff')
      .attr('pointer-events', 'none')
      .text(d => d.title.substring(0, 15))
      .style('font-weight', 500);

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);

      labels
        .attr('x', d => d.x)
        .attr('y', d => d.y);
    });

    // Add hover effects - highlight connected nodes
    node.on('mouseenter', function(event, d) {
      d3.select(this)
        .attr('r', 30)
        .attr('fill', '#a78bfa');
      
      link.style('opacity', link_d => 
        link_d.source.id === d.id || link_d.target.id === d.id ? 1 : 0.2
      );
      
      labels.style('opacity', node_d => 
        node_d.id === d.id || 
        links.some(l => (l.source.id === d.id && l.target.id === node_d.id) || 
                        (l.target.id === d.id && l.source.id === node_d.id))
        ? 1 : 0.3
      );
    })
    .on('mouseleave', function() {
      d3.select(this)
        .attr('r', 20)
        .attr('fill', '#6366f1');
      
      link.style('opacity', 0.6);
      labels.style('opacity', 1);
    });

    // Add zoom behavior
    const zoom = d3.zoom()
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Drag function
    function drag(simulation) {
      function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }
      function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
      }
      function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }
      return d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended);
    }
  }, [notes, onSelectNote]);

  return (
    <div className="graph-container">
      <svg ref={svgRef} className="graph-svg"></svg>
    </div>
  );
}

export default Graph;
