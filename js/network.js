// D3.js Force-Directed Network for Five Navigation Nodes

// Data structure for the eleven pages
const data = {
  nodes: [
    { id: "node1", group: 1, label: "🍎", url: "#" },
    { id: "node2", group: 2, label: "🍌", url: "#" },
    { id: "node3", group: 3, label: "🥪", url: "#" },
    { id: "node4", group: 4, label: "🍞", url: "#" },
    { id: "node5", group: 5, label: "🧀", url: "#" },
    { id: "node6", group: 6, label: "🍇", url: "#" },
    { id: "node7", group: 7, label: "🍓", url: "#" },
    { id: "node8", group: 8, label: "🍊", url: "#" },
    { id: "node9", group: 9, label: "🍉", url: "#" },
    { id: "node10", group: 10, label: "🍍", url: "#" },
    { id: "node11", group: 11, label: "🥑", url: "#" }
  ],
  links: [
    { source: "node1", target: "node2", value: 1 },
    { source: "node2", target: "node3", value: 1 },
    { source: "node3", target: "node4", value: 1 },
    { source: "node4", target: "node5", value: 1 },
    { source: "node5", target: "node6", value: 1 },
    { source: "node6", target: "node7", value: 1 },
    { source: "node7", target: "node8", value: 1 },
    { source: "node8", target: "node9", value: 1 },
    { source: "node9", target: "node10", value: 1 },
    { source: "node10", target: "node11", value: 1 },
    { source: "node11", target: "node1", value: 1 }
  ]
};

function createNetwork() {
  const container = document.getElementById('network-container');
  const width = container.clientWidth || 600;
  const height = container.clientHeight || 400;

  // Color scale - using shades of gray
  const color = d3.scaleOrdinal()
    .domain([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
    .range(['#1a1a1a', '#262626', '#333333', '#404040', '#4d4d4d', '#595959', '#666666', '#737373', '#808080', '#8c8c8c', '#999999']);

  // Create copies of data
  const links = data.links.map(d => ({...d}));
  const nodes = data.nodes.map(d => ({...d}));

  // Initialize nodes with completely random positions across the entire area
  nodes.forEach(node => {
    node.x = Math.random() * width;
    node.y = Math.random() * height;
  });

  // Create force simulation with minimal forces for truly organic behavior
  const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id).distance(50).strength(0.05))
    .force("charge", d3.forceManyBody().strength(-50))
    .alphaDecay(0.01)
    .velocityDecay(0.2)
    .on("tick", ticked);

  // Create SVG
  const svg = d3.select("#network-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto;");

  // Add links
  const link = svg.append("g")
    .attr("stroke", "#000000")
    .attr("stroke-opacity", 0.4)
    .selectAll("line")
    .data(links)
    .join("line")
    .attr("stroke-width", 2);

  // Add node groups (circles + text)
  const nodeGroup = svg.append("g")
    .selectAll("g")
    .data(nodes)
    .join("g")
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended))
    .on("click", (event, d) => {
      window.location.href = d.url;
    })
    .style("cursor", "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"32\" viewBox=\"0 0 32 32\"><circle cx=\"16\" cy=\"16\" r=\"8\" fill=\"%237cb342\" opacity=\"0.6\"/></svg>') 16 16, pointer");

  // Add an invisible hit area to make dragging easy
  nodeGroup.append("circle")
    .attr("r", 34)
    .attr("fill", "transparent")
    .attr("stroke", "none")
    .style("pointer-events", "all");

  // Add emoji labels centered at node positions
  nodeGroup.append("text")
    .attr("text-anchor", "middle")
    .attr("dy", "0.35em")
    .style("font-size", "48px")
    .style("user-select", "none")
    .style("pointer-events", "auto")
    .style("font-family", '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif')
    .style("transition", "transform 250ms ease")
    .text(d => d.label);

  // Create cursor label element
  const cursorLabel = d3.select("body").append("div")
    .attr("class", "cursor-label")
    .style("position", "fixed")
    .style("pointer-events", "none")
    .style("color", "#1a1a1a")
    .style("font-size", "24px")
    .style("font-weight", "700")
    .style("z-index", "1000")
    .style("opacity", "0")
    .style("transition", "opacity 0.3s")
    .style("text-transform", "uppercase")
    .style("letter-spacing", "0.05em")
    .style("-webkit-text-stroke", "2px white")
    .style("paint-order", "stroke fill");

  // No breathing animation when using only emojis

  // Add hover effects with bigger size
  nodeGroup
    .on("mouseenter", function(event, d) {
      // Enlarge emoji on hover
      d3.select(this).select("text")
        .style("transform", "scale(1.35)");
      // Show cursor label
      cursorLabel
        .text(d.label)
        .style("opacity", "1");
    })
    .on("mousemove", function(event) {
      // Follow cursor
      cursorLabel
        .style("left", (event.pageX + 15) + "px")
        .style("top", (event.pageY + 15) + "px");
    })
    .on("mouseleave", function(event, d) {
      // Restore emoji size
      d3.select(this).select("text")
        .style("transform", "scale(1)");
      // Hide cursor label
      cursorLabel
        .style("opacity", "0");
    });

  // Update positions on tick
  function ticked() {
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    nodeGroup
      .attr("transform", d => `translate(${d.x},${d.y})`);
  }

  // Drag functions with stronger force feedback
  function dragstarted(event) {
    if (!event.active) simulation.alphaTarget(0.7).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
    
    // No circle to resize
  }

  function dragged(event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  function dragended(event) {
    if (!event.active) simulation.alphaTarget(0);
    // Release the node - let physics take over
    event.subject.fx = null;
    event.subject.fy = null;
    
    // No circle to resize
  }

  // Handle window resize
  window.addEventListener('resize', () => {
    const newWidth = container.clientWidth;
    const newHeight = container.clientHeight;
    svg.attr("width", newWidth).attr("height", newHeight);
    svg.attr("viewBox", [0, 0, newWidth, newHeight]);
    
    simulation.force("center", d3.forceCenter(newWidth / 2, newHeight / 2));
    simulation.alpha(0.5).restart();
  });
}

// Initialize network when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createNetwork);
} else {
  createNetwork();
}
