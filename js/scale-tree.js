// Collapsible D3 tree for Scale overlay (refined)
(function () {
  const toggleBtn = document.getElementById("toggle-scale");
  const overlay = document.getElementById("scale-overlay");
  const canvas = document.getElementById("scale-canvas");

  let svg = null;
  let tree, root, gLink, gNode;

  const CFG = {
    width: Math.min(1000, window.innerWidth * 0.92),  // Wider canvas
    minHeight: 480,
    dx: 24,
    dy: 240,
    leftPad: 180,  // Adjusted for better positioning
    transitionDuration: 360,
    labelPadX: 10,
    labelPadY: 8,
    // Hierarchical sizing for visual prominence
    circleRadiusMain: 7,      // main scale nodes (depth 1)
    circleRadiusLeaf: 4.5,    // leaf nodes (depth 2)
    circleRadiusRoot: 8,      // root node (depth 0)
    nodeGap: 1.3,
    // Interface emphasis (website accent)
    interfaceColor: '#7cb342',
    interfaceHighlight: '#f5f9f2',
    // Link hierarchy
    trunkOpacity: 0.7,
    branchOpacity: 0.35,
    interfaceLinkOpacity: 0.6
  };

  const rootData = {
    name: "Multi-Scalar Framing:\nFood Systems, Infrastructure,\nand Urban Life", // Diagram caption, not primary node
    children: [
      {
        name: "Global food and climate\nsystems",
        children: [
          { name: "System: agriculture + processing + trade" },
          { name: "Signals: emissions factors, subsidies, price signals" },
          { name: "Levers: dietary shifts, procurement standards" }
        ]
      },
      {
        name: "New York City",
        children: [
          { name: "System: distribution infrastructure + regulation" },
          { name: "Signals: retail density, supply-chain fragility" },
          { name: "Levers: policy, procurement, institutional programs" }
        ]
      },
      {
        name: "Neighborhood-level\nexposure and vulnerability",
        children: [
          { name: "System: access + affordability + storage capacity" },
          { name: "Signals: poverty, low-storage proxies, food availability" },
          { name: "Levers: targeted interventions, community networks" }
        ]
      },
      {
        name: "Interpretive Interface", // Core intervention - single line for emphasis
        children: [
          { name: "Signals: infrastructural intensity, flows" },
          { name: "Mechanism: comparison, spatial framing" },
          { name: "Output: visibility + interpretability" }
        ]
      },
      {
        name: "Everyday food\npractices",
        children: [
          { name: "Unit: meals, purchases, routines" },
          { name: "Constraints: time, budget, habit, access" },
          { name: "Impact: aggregated demand → system change" }
        ]
      }
    ]
  };

  // --- Helpers ---
  const diagonal = d3
    .linkHorizontal()
    .x((d) => d.y)
    .y((d) => d.x);

  function isInterfaceNode(d) {
    return /Interpretive\s*Interface/i.test(String(d.data.name || ""));
  }

  // Ancestry helpers for hover interaction
  function isAncestor(ancestor, node) {
    let current = node.parent;
    while (current) {
      if (current === ancestor) return true;
      current = current.parent;
    }
    return false;
  }

  function isDescendant(descendant, node) {
    return isAncestor(node, descendant);
  }

  function initChart() {
    if (typeof d3 === "undefined") {
      console.error("D3 failed to load.");
      return;
    }

    tree = d3
      .tree()
      .nodeSize([CFG.dx, CFG.dy])
      .separation(() => CFG.nodeGap);

    root = d3.hierarchy(rootData);
    root.x0 = 0;
    root.y0 = 0;

    // Expand all by default, but keep _children for toggling
    root.each((d) => {
      if (d.children) d._children = d.children;
    });

    svg = d3
      .create("svg")
      .attr("width", CFG.width)
      .attr("height", CFG.minHeight)
      .attr("viewBox", [0, 0, CFG.width, CFG.minHeight])
      .attr(
        "style",
        "max-width: 100%; height: auto; font-family: 'Lexend Deca', sans-serif; font-weight: 400; user-select: none;"
      );

    // Links
    gLink = svg
      .append("g")
      .attr("fill", "none")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.35)
      .attr("stroke-width", 1.5);

    // Nodes
    gNode = svg.append("g").attr("cursor", "pointer").attr("pointer-events", "all");

    canvas.innerHTML = "";
    canvas.appendChild(svg.node());

    update(root);
  }

  function update(source) {
    tree(root);

    // Compute bounds
    let left = root,
      right = root;
    root.eachBefore((d) => {
      if (d.x < left.x) left = d;
      if (d.x > right.x) right = d;
    });

    const height = Math.max(
      CFG.minHeight,
      right.x - left.x + CFG.dx * 6 // reduce padding multiplier
    );

    svg
      .attr("height", height)
      .attr("viewBox", [0, left.x - CFG.dx * 2.5 - 10, CFG.width, height]); // centered vertically

    const t = svg
      .transition()
      .duration(CFG.transitionDuration)
      .ease(d3.easeCubicInOut);

    // --- LINKS ---
    // Hierarchical link styling: trunk (root→main) stronger than branches (main→leaf)
    const links = root.links();

    const link = gLink.selectAll("path").data(links, (d) => d.target);

    link
      .enter()
      .append("path")
      .attr("stroke", (d) => isInterfaceNode(d.target) ? CFG.interfaceColor : "#999")
      .attr("stroke-opacity", (d) => {
        // Trunk links (depth 1): more prominent
        if (d.target.depth === 1) return CFG.trunkOpacity;
        // Interface links: medium emphasis to show translation layer
        if (isInterfaceNode(d.source) || isInterfaceNode(d.target)) return CFG.interfaceLinkOpacity;
        // Branch links (depth 2): recede
        return CFG.branchOpacity;
      })
      .attr("stroke-width", (d) => isInterfaceNode(d.target) ? 1.8 : 1.3)
      .attr("d", () => {
        const o = { x: source.x0, y: source.y0 + CFG.leftPad };
        return diagonal({ source: o, target: o });
      })
      .merge(link)
      .transition(t)
      .attr("d", (d) =>
        diagonal({
          source: { x: d.source.x, y: d.source.y + CFG.leftPad },
          target: { x: d.target.x, y: d.target.y + CFG.leftPad }
        })
      );

    link
      .exit()
      .transition(t)
      .attr("d", () => {
        const o = { x: source.x, y: source.y + CFG.leftPad };
        return diagonal({ source: o, target: o });
      })
      .remove();

    // --- NODES ---
    const nodes = root.descendants();

    const node = gNode.selectAll("g.node").data(nodes, (d) => d);

    const nodeEnter = node
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", `translate(${source.y0 + CFG.leftPad},${source.x0})`)
      .attr("fill-opacity", 0)
      .attr("stroke-opacity", 0);

    // Circle: hierarchical sizing reinforces reading order
    nodeEnter
      .append("circle")
      .attr("r", (d) => {
        if (d.depth === 0) return CFG.circleRadiusRoot;      // Root: caption weight
        if (d.depth === 1) return CFG.circleRadiusMain;      // Main scale nodes: prominent
        return CFG.circleRadiusLeaf;                          // Leaf nodes: recede
      })
      .attr("fill", (d) => {
        // Interface node gets subtle highlight to show intervention layer
        if (isInterfaceNode(d)) return CFG.interfaceHighlight;
        return d.children ? "#1a1a1a" : "#fff";
      })
      .attr("stroke", (d) => isInterfaceNode(d) ? CFG.interfaceColor : "#1a1a1a")
      .attr("stroke-width", (d) => {
        if (isInterfaceNode(d)) return 2.4;  // Emphasize interface as translation layer
        if (d.depth === 1) return 1.8;        // Main nodes: clear structure
        return 1.2;                            // Leaf nodes: lightweight
      });

    // Label group (text only, no background)
    const labelGroup = nodeEnter.append("g").attr("class", "label-group");

    labelGroup
      .append("text")
      .attr("dy", "0.32em")
      .attr("text-anchor", (d) => (d.depth === 0 ? "end" : "start"))
      .attr("fill", (d) => {
        if (d.depth === 0) return "#666";           // Caption: recede from diagram structure
        if (isInterfaceNode(d)) return "#2a2a2a";   // Interface: slightly darker for emphasis
        if (d.depth === 1) return "#1a1a1a";        // Main scale nodes: strong presence
        return "#444";                               // Leaf nodes: lighter weight
      })
      .attr("font-size", (d) => {
        if (d.depth === 0) return "11px";           // Root as caption, not competing node
        if (d.depth === 1) return "12.5px";         // Main nodes: readable hierarchy
        return "11.5px";                             // Leaf nodes: consistent detail
      })
      .attr("font-weight", (d) => {
        if (d.depth === 0) return 500;              // Caption weight
        if (d.depth === 1) return 600;              // Main nodes: structural clarity
        if (isInterfaceNode(d.parent)) return 500;  // Interface children: medium
        return 420;                                  // Leaf nodes: light
      })
      .attr("letter-spacing", (d) => d.depth === 1 ? "0.01em" : "0");

    // Update labels (enter + update)
    const nodeMerge = node.merge(nodeEnter);

    nodeMerge.each(function (d) {
      const g = d3.select(this);
      const txtSel = g.select(".label-group text");

      const lines = String(d.data.name || "").split("\n");
      txtSel.selectAll("tspan").remove();

      const isRoot = d.depth === 0;
      const xPos = isRoot ? -14 : 14;

      lines.forEach((line, i) => {
        // Make "System:", "Signals:", "Levers:" bold
        const boldPattern = /^(System|Signals|Levers):/;
        const match = line.match(boldPattern);
        
        const tspan = txtSel
          .append("tspan")
          .attr("x", xPos)
          .attr("dy", i === 0 ? 0 : 13.5); // Consistent line spacing for readability
        
        if (match) {
          // Split into bold prefix and regular rest
          tspan.append("tspan")
            .attr("font-weight", 700)
            .text(match[1] + ":");
          tspan.append("tspan")
            .text(line.substring(match[0].length));
        } else {
          tspan.text(line);
        }
      });
    });

    // Minimal hover interaction: highlight active branch, dim others
    nodeMerge
      .on("mouseenter", function(event, d) {
        if (!d.parent) return; // Skip root
        
        // Dim all non-related nodes and links
        gNode.selectAll("g.node")
          .transition().duration(150)
          .attr("opacity", (n) => {
            // Keep current node, ancestors, and descendants visible
            let current = d;
            while (current) {
              if (current === n) return 1;
              current = current.parent;
            }
            return n.depth === 0 || isAncestor(n, d) || isDescendant(n, d) ? 1 : 0.25;
          });
        
        gLink.selectAll("path")
          .transition().duration(150)
          .attr("stroke-opacity", (l) => {
            return (l.source === d || l.target === d || isAncestor(l.source, d) || isAncestor(l.target, d)) 
              ? (l.target.depth === 1 ? CFG.trunkOpacity : CFG.interfaceLinkOpacity)
              : 0.12;
          });
      })
      .on("mouseleave", function() {
        // Restore default opacity
        gNode.selectAll("g.node")
          .transition().duration(200)
          .attr("opacity", 1);
        
        gLink.selectAll("path")
          .transition().duration(200)
          .attr("stroke-opacity", (d) => {
            if (d.target.depth === 1) return CFG.trunkOpacity;
            if (isInterfaceNode(d.source) || isInterfaceNode(d.target)) return CFG.interfaceLinkOpacity;
            return CFG.branchOpacity;
          });
      })
      .on("click", (event, d) => {
        if (!d._children && !d.children) return; // leaf, do nothing
        d.children = d.children ? null : d._children;
        update(d);
        event.stopPropagation();
      });

    // Position transition
    nodeMerge
      .transition(t)
      .attr("transform", (d) => `translate(${d.y + CFG.leftPad},${d.x})`)
      .attr("fill-opacity", 1)
      .attr("stroke-opacity", 1);

    node
      .exit()
      .transition(t)
      .attr("transform", `translate(${source.y + CFG.leftPad},${source.x})`)
      .attr("fill-opacity", 0)
      .attr("stroke-opacity", 0)
      .remove();

    // Stash old positions
    root.eachBefore((d) => {
      d.x0 = d.x;
      d.y0 = d.y;
    });
  }

  // Overlay open/close
  if (toggleBtn && overlay) {
    toggleBtn.addEventListener("click", () => {
      const isOpen = overlay.style.display !== "none";
      if (isOpen) {
        overlay.style.display = "none";
        toggleBtn.textContent = "Scale";
      } else {
        overlay.style.display = "flex";
        toggleBtn.textContent = "Close";
        if (!svg) initChart();
      }
    });

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.style.display = "none";
        toggleBtn.textContent = "Scale";
      }
    });
  }
})();
