import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './Graph.css';

function Graph({ notes }) {
  const svgRef = useRef();

  useEffect(() => {
    if (!svgRef.current || notes.length === 0) return;

    // Prepare data for graph
    const nodes = notes.map(note => ({
      id: note.id,
      title: note.title || 'Untitled'
    }));

    // Create simple links (for now, link notes alphabetically for demo)
    const links = [];
    for (let i = 0; i < notes.length - 1; i++) {
      links.push({
        source: notes[i].id,
        target: notes[i + 1].id
      });
    }

    // Get dimensions
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links)
        .id(d => d.id)
        .distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));

    // Create links
    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#4b5563')
      .attr('stroke-width', 2)
      .attr('opacity', 0.6);

    // Create nodes
    const node = svg.append('g')
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', 20)
      .attr('fill', '#6366f1')
      .attr('opacity', 0.8)
      .call(drag(simulation));

    // Add labels
    const labels = svg.append('g')
      .selectAll('text')
      .data(nodes)
      .enter()
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.3em')
      .attr('font-size', '12px')
      .attr('fill', '#ffffff')
      .attr('pointer-events', 'none')
      .text(d => d.title.substring(0, 10));

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

    // Add hover effects
    node.on('mouseenter', function(event, d) {
      d3.select(this)
        .attr('r', 30)
        .attr('fill', '#a78bfa');
      
      labels.style('opacity', node_d => node_d.id === d.id ? 1 : 0.3);
    })
    .on('mouseleave', function() {
      d3.select(this)
        .attr('r', 20)
        .attr('fill', '#6366f1');
      
      labels.style('opacity', 1);
    });

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

  }, [notes]);

  return (
    <div className="graph-container">
      <svg ref={svgRef} className="graph-svg"></svg>
    </div>
  );
}

export default Graph;
