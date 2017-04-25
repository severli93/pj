function createBoxVis(totalT, totalW, Tdata, Wdata, plot,width) {

  console.log("TData:",Tdata);
  console.log("WData:",Wdata);


    let g = plot.select(".stackedBar");
    if (!g.node()){
      g = plot.append("g").classed("stackedBar",true)
    }

    const maxWidth = 400, maxHeight=110;
    const scaleHeight = d3.scaleLinear().domain([0, d3.max([totalT, totalW])]).range([0, maxHeight]);
    const scaleT = d3.scaleLinear().domain([0, totalT]).range([0, maxWidth]);
    const scaleW = d3.scaleLinear().domain([0, totalW]).range([0, maxWidth]);



    let sum = 0;
    let TLatest = 0, TNews = 0;
    Tdata = Tdata.sort(function(a, b) { return a.key == "latest" ? -1 :1 }).map(d => {
      if (d.key == "latest") { TLatest = d.value; } else { TNews = d.value; }
      d.prev = sum;
      sum = d.value+sum;
      return d;
    });
    let tg = g.select(".twitter")
    if(!tg.node()){
      tg = g.append("g")
        .classed("twitter",true)
        .attr("transform",`translate(${maxWidth-width}, 0)`);
    }
  d3.select("#noTweets").text(totalT);
  d3.select("#noWeibos").text(totalW);
    const barT=tg.selectAll('rect')
      .data(Tdata, (d, i) => i);
    barT.exit().remove();
      barT.enter()
      .append("rect")
      .attr("class", d=>d.key)
      .merge(barT)
      .transition()
      .attr("y", maxHeight-scaleHeight(totalT))
      .attr("x", (d,i) => scaleT(d.prev)+i)
      .attr("width", d => scaleT(d.value))
      .attr("height", scaleHeight(totalT));

    sum = 0;
    Wdata = Wdata.sort(function(a, b) { return a.key == "latest" ? -1 :1 }).map(d => {
      d.prev = sum;
      sum = d.value+sum;
      return d;
    });
    let wg = g.select(".weibo")
    if(!wg.node()){
      wg = g.append("g")
      .classed("weibo",true);
    }

    // wg.selectAll("rect").remove();
    const barW = wg.selectAll("rect")
      .data(Wdata.sort(d=>d.key), (d, i)=>i);
      barW.exit().remove();
    barW.enter()
      .append("rect")
      .attr("class", d=>d.key)
      .merge(barW)
      .transition()
      .attr("y", maxHeight-scaleHeight(totalW))
      .attr("x", (d,i) => scaleW(d.prev)+i)
      .attr("width", d => scaleW(d.value))
      .attr("height",scaleHeight(totalW));
}

function createBulletVis(clustersT, clustersW, plot, width) {

  let g = plot.select(".bullet-graph");
  if (!g.node()){
    g = plot.append("g")
      .classed("bullet-graph", true)
      .attr("transform", "translate("+margin.left+","+margin.top*0.3+")");
  }
  //data process ---------------------------------------
  //combine teitter and weibo cluster data
  const data = clustersT.map(d => {
      d.source = "twitter";
      return d;
    }).concat(clustersW.map(d => {
      d.source = "weibo";
      return d;
    }));
  //nest data by cluster id
  const nestedData = d3.nest()
    .key(d => d.cluster_id)
    .entries(data);

  nestedData2 = nestedData.slice()
  //---------------------------------------------------

  const scaleX = d3.scaleLinear().domain([0, 2.9]).range([0, width]);
  const axisX = d3.axisTop().scale(scaleX);

  const scaleY = d3.scaleOrdinal().domain(nestedData.map(d => d.values[0].name)).range(d3.range(20, 35*nestedData.length, 35));
  const axisY = d3.axisLeft().scale(scaleY);

  //draw bullet graph----------------------------------
  g.selectAll("g").remove();
  const bulletG = g.selectAll("g")
    .data(nestedData, function(d, i) { return i; })
    .enter()
    .append("g")
    .attr("transform", (d, i) => `translate(0, ${scaleY(d.values[0].name)})`);

  bulletG.append("line")
    .classed("bullet-line", true)
    .attr("x1", d => {
      const weiboPoint = d.values.filter(e => e.source=="weibo")[0];
      return scaleX(weiboPoint.countFraction);
    })
    .attr("y1", 0)
    .attr("x2", d => {
      const twitterPoint = d.values.filter(e => e.source=="twitter")[0];
      return scaleX(twitterPoint.countFraction);
    })
    .attr("y2", 0);

  const twitterCircles = bulletG.selectAll("circle.twitter")
    .data(d => d.values.filter(e => e.source=="twitter"))
    .enter()
    .append("circle")
    .classed("twitter", true)
    .attr("r", 6)
    .attr("cx", d => scaleX(d.countFraction))
    .attr("cy", 0)
    .call(getTooltipCircle);

  const weiboCircles = bulletG.selectAll("circle.weibo")
    .data(d => d.values.filter(e => e.source=="weibo"))
    .enter()
    .append("circle")
    .classed("weibo", true)
    .attr("r", 6)
    .attr("cx", d => scaleX(d.countFraction))
    .attr("cy", 0)
    .call(getTooltipCircle);
  //---------------------------------------------------

  //draw axes x & y
  let axisXEle = g.select(".axisX");
  let axisYEle = g.select(".axisY");
  if (!axisXEle.node()) {
    axisXEle = g.append("g").classed("axisX", true);
  }
  if (!axisYEle.node()) {
    axisYEle = g.append("g").classed("axisY", true).attr("transform", "translate(-20, 0)");
  }
  axisXEle.call(axisX);
  axisYEle.call(axisY);
  axisYEle.call(getTooltipAxisY);
  //---------------------------------------------------
}
 function getTooltipCircle(selection){
   let tooltip=d3.select("#tooltip1")
   selection
   .on('mouseenter', function(d){
     tooltip.classed("visible", true)
     .style("top", d3.event.offsetY+10+ "px")
     .style("left", d3.event.offsetX + "px");
     let wordList = d.words.join(", ");
     tooltip.select('#wordList').html(wordList);
     tooltip.select('#tweetCount').html(d.tweetCount);
     tooltip.select('#freqScore').html(d.countFraction.toFixed(2));
   })
   .on('mouseout', function(d){
     tooltip.classed("visible", false);
   })
 }
  function getTooltipAxisY(selection){
    let text = selection.selectAll(".tick text");
    let tooltip=d3.select("#tooltip2")
    text
    .on('click', function(){
      if (tooltip.node().classList.contains("visible")) {
        tooltip.node().classList.remove("visible");
        return;
      }
      // get the text on which user clicked
      // `this` is the axisY tick (text-part) that user clicked on
      var selectedClusterName = this.textContent;
      var cluster = clusterDataTopicDimension.top(Infinity).filter(d => d.name==selectedClusterName)[0];

      tooltip
      .classed("visible", true)
      .transition()
      .style("top", d3.event.offsetY+5+ "px")
      .style("left",margin.left+ "px");
      var translatedArray = cluster.words.map(d => {
        if (translation[d]) {
          return d+"("+translation[d]+")";
        }
        return d;
      });
      tooltip.select('#wordList').html(translatedArray.join(", "));
    })
    // .on('mouseout', function(d){
    //   tooltip
    //   .classed("visible", false);
    // })
  }
