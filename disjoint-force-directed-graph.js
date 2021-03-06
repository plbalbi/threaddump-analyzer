updateRunningProcesses = () => {
  // clean previous options
  console.log("Fetching processes running")

  var runningProcessesSelectBox = d3.select("#runningProcesses")
  runningProcessesSelectBox.selectAll("option").remove()

  fetch("http://localhost:3000/processes")
    .then(response => response.json())
    .then(processes => {
      processes.forEach(process =>
        runningProcessesSelectBox
          .append("option")
          .attr("value", process.pid)
          .text(process.name)
      )
    })
}

var lastSelectedNode = null

generateD3Graph = (graphJson) => {
  // delete previous graphs
  d3.select("#svgcontainer").selectAll("svg").remove()

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
    const currentFilter = document.getElementById("threadFilter").value

    if (currentFilter)  {
      return d => d.group == THREAD_ID ? (d.name.includes(currentFilter) ? "#FF0000" : "#888888") : "#002bff"
    } else {
      // red are threads, blue are locks
      return d => d.group == THREAD_ID ? "#FF0000" : "#002bff"
    }
  }

  height = 680
  width = 680

  data = graphJson

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


    svg.append("svg:defs").append("svg:marker")
        .attr("id", "arrow")
        .attr("viewBox", "0 -5 10 10")
        .attr('refX', 26)//so that it comes towards the center.
        .attr("markerWidth", 5)
        .attr("markerHeight", 5)
        .attr("orient", "auto")
      .append("svg:path")
        .attr("d", "M0,-5L10,0L0,5");
    

    const link = svg.append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
        .attr("stroke-width", .6) 
        .attr("marker-end", "url(#arrow)");

    const node = svg.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(nodes)
      .join("circle")
        .attr("r", 5)
        .attr("fill", color())
        .attr("id", node => node.id)
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

    node.append("objectId")
        .text(d => d.object_id);

    node.append("name")
        .text(d => d.group == THREAD_ID ? d.name : d.classname);

    node.on("click", (d,i,g) => {
          if (d3.event.currentTarget.id.includes(THREAD_ID)) {
            // https://stackoverflow.com/questions/25123003/how-to-assign-click-event-to-every-svg-element-in-d3js
            if (lastSelectedNode) {
              d3.select(lastSelectedNode)
                .attr("fill", color());
            }
            lastSelectedNode = g[i]
            d3.select(lastSelectedNode)
              .attr("fill","#F1BC50")
            var currentThread = data.nodes.find(node => node.id == d3.event.currentTarget.id)
            var stacktrace = currentThread.name + " (" + currentThread.object_id + ")" + "\n\n"
            stacktrace = String.prototype.concat.apply(stacktrace, currentThread.frames.map(frame => frame + "\n"))
            document.getElementById("stacktrace").innerHTML = stacktrace
          }
          // stop event from propagating to svg
          d3.event.stopPropagation()
        })

    onTextAreaChange = () => {
      node
          .attr("fill", color());
    }

    document.getElementById("threadFilter").onchange = onTextAreaChange
    document.getElementById("threadFilter").onkeyup = onTextAreaChange

    simulation.on("tick", () => {
      link
          .attr("x1", d => d.source.x)
          .attr("y1", d => d.source.y)
          .attr("x2", d => d.target.x)
          .attr("y2", d => d.target.y);

      node
          .attr("cx", d => d.x)
          .attr("cy", d => d.y)
    });

    svg.on("click", (d,i,g) => {
      // clear last selected node
      d3.select(lastSelectedNode)
        .attr("fill", color());
      // clear stacktrace
      document.getElementById("stacktrace").innerHTML = "";
    })
  }

  chart()

}