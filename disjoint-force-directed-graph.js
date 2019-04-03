genrateD3Graph = () => {

  const THREAD_ID = "THREAD"
  const SYNC_ID = "SYNC"

  drag = simulation => {
    
    function dragstarted(d) {
      if (!d3.event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }
    
    function dragended(d) {
      if (!d3.event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    
    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
  }

  color = () => {
    const scale = d3.scaleOrdinal(d3.schemeCategory10);

    // red are threads, blue are locks
    return d => d.group == THREAD_ID ? "#FF0000" : "#002bff"
  }

  height = 680
  width = 680

  data = JSON.parse(document.getElementById("GENERATED_JSON").innerHTML) 

  chart = () => {
    const links = data.links.map(d => Object.create(d));
    const nodes = data.nodes.map(d => Object.create(d));

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id))
        .force("charge", d3.forceManyBody())
        .force("x", d3.forceX())
        .force("y", d3.forceY());

    const svg = d3.select("#svgcontainer")
        .append("svg")
        .attr("height", "1000px")
        .attr("width", "1000px")
        .attr("viewBox", [-width / 2, -height / 2, width, height]);

    const link = svg.append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
        .attr("stroke-width", d => Math.sqrt(d.value));

    const node = svg.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(nodes)
      .join("circle")
        .attr("r", 5)
        .attr("fill", color())
        .call(drag(simulation));

    node.append("title")
        .text(d => {
          if (d.group == THREAD_ID) {
            // It's a thread
            return  d.name +  " (" + d.object_id + ")"
          } else {
            // It's a sync
            return  d.classname +  " (" + d.object_id + ")"
          }
        });

    simulation.on("tick", () => {
      link
          .attr("x1", d => d.source.x)
          .attr("y1", d => d.source.y)
          .attr("x2", d => d.target.x)
          .attr("y2", d => d.target.y);

      node
          .attr("cx", d => d.x)
          .attr("cy", d => d.y);
    });
  }

  chart()

}