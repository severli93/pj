const margin = {left: 80, top: 30, right: 80, bottom: 50};
const pieGraphSvg = d3.select("#pie-graph").attr("width", d3.select(".pie").node().clientWidth).attr("height", "200px");
const pieGraphPlot = pieGraphSvg.append('g')
  .attr("transform","translate("+margin.left+","+margin.top+")");
const barGraphSvg = d3.select("#bar-graph").attr("width", d3.select(".bar").node().clientWidth).attr("height", "100px");
const barGraphPlot = barGraphSvg.append('g')
  .attr("transform","translate("+margin.left+","+margin.top+")");
const bulletGraphSvg = d3.select("#bullet-graph-news").attr("width", d3.select(".bullet").node().clientWidth).attr("height", "900px");
const bulletGraphPlot = bulletGraphSvg.append("g")
  .attr("transform", "translate("+margin.left+","+margin.top+")");
// const bulletGraphSvg2 = d3.select("#bullet-graph-users").attr("width", d3.select(".bullet").node().clientWidth).attr("height", "900px");
// // window.innerHeight
// const bulletGraphPlot2 = bulletGraphSvg2.append("g")
//   .attr("transform", "translate("+margin.left*0.8+","+margin.top+")");

const dataRoot = "/data/experiment-2/";
const searchIds = ["aiweiwei", "dalailama", "feminism", "isis", "panda", "twochildpolicy", "vpn"];
const translation = {};
let clusterData, clusterDataCF, masterData, masterDataCF, freqData, freqDataCF;
let clusterDataTopicDimension, masterInfoTypeDimension, masterTopicDimension, masterSourceDimension, freqSourceDimension, freqTopicDimension;
queue()
  .defer(d3.csv, dataRoot+"cluster_data_conv.csv")
  .defer(d3.json, dataRoot+"twitter/aiweiwei_final.json")
  .defer(d3.json, dataRoot+"twitter/dalailama_final.json")
  .defer(d3.json, dataRoot+"twitter/feminism_final.json")
  .defer(d3.json, dataRoot+"twitter/isis_final.json")
  .defer(d3.json, dataRoot+"twitter/panda_final.json")
  .defer(d3.json, dataRoot+"twitter/twochildpolicy_final.json")
  .defer(d3.json, dataRoot+"twitter/vpn_final.json")
  .defer(d3.json, dataRoot+"weibo/aiweiwei_final.json")
  .defer(d3.json, dataRoot+"weibo/feminism_final.json")
  .defer(d3.json, dataRoot+"weibo/isis_final.json")
  .defer(d3.json, dataRoot+"weibo/panda_final.json")
  .defer(d3.json, dataRoot+"weibo/twochildpolicy_final.json")
  .defer(d3.json, dataRoot+"weibo/vpn_final.json")
  .defer(d3.csv,dataRoot+"weibo/freqWordsList.csv")
  .defer(d3.csv,dataRoot+"twitter/freqWordsList.csv")
  .awaitAll((err, results) => {

    clusterData = results[0].map(d => {
      delete d[""];
      d.words = d.words.split("=").map(e => {
        const x = e.split("/");
        if (x.length > 1) {
          translation[x[0]] = x[1];
        }
        return x[0];
      });
      // d.wordsEng =d.words.split("/")[0];
      // console.log("wordsEng",d);
      return d;
    });

    console.log("raw cluster data:",clusterData);
    clusterDataCF = crossfilter(clusterData);
    clusterDataTopicDimension = clusterDataCF.dimension(d => d.topic);

    function processTData(d, topic) {
      return new Data(d, "twitter", topic);
    }

    function processWData(d, topic) {
      return new Data(d, "weibo", topic);

    }

    masterData = results[1].map(d => {
        return processTData(d, searchIds[0]);
      }).concat(results[2].map(d => {
        return processTData(d, searchIds[1]);
      })).concat(results[3].map(d => {
        return processTData(d, searchIds[2]);
      })).concat(results[4].map(d => {
        return processTData(d, searchIds[3]);
      })).concat(results[5].map(d => {
        return processTData(d, searchIds[4]);
      })).concat(results[6].map(d => {
        return processTData(d, searchIds[5]);
      })).concat(results[7].map(d => {
        return processTData(d, searchIds[6]);
      })).concat(results[8].map(d => {
        return processWData(d, searchIds[0]);
      })).concat(results[9].map(d => {
        return processWData(d, searchIds[2]);
      })).concat(results[10].map(d => {
        return processWData(d, searchIds[3]);
      })).concat(results[11].map(d => {
        return processWData(d, searchIds[4]);
      })).concat(results[12].map(d => {
        return processWData(d, searchIds[5]);
      })).concat(results[13].map(d => {
        return processWData(d, searchIds[6]);
      }));

    freqData = results[14].map(d => {
        d.source = "weibo";
        return d;
      }).concat(results[15].map(d=> {
        d.source = "twitter";
        return d;
      }));
    freqDataCF = crossfilter(freqData);
    freqTopicDimension = freqDataCF.dimension(d => d.topic);
    freqSourceDimension = freqDataCF.dimension(d => d.source);

    masterDataCF = crossfilter(masterData);
    masterInfoTypeDimension = masterDataCF.dimension(d => d.infoType)
    masterTopicDimension = masterDataCF.dimension(d => d.topic);
    masterSourceDimension = masterDataCF.dimension(d => d.source);
    d3.select("#currentTopic")
      .selectAll("button")
      .data(searchIds).enter()
      .append("button")
      .attr("class", function(_, i) { return i==0 ? "btn topic-btn active":"btn topic-btn"; })
      .text(d => d.toUpperCase())
      .on("click", function(d){
        d3.selectAll(".topic-btn").classed("active", false);
        this.classList.add("active");
        setTimeout(processData, 0, d);
      });

    setTimeout(processData, 0, searchIds[0]);

  });

function processData(topic) {
  clusterDataTopicDimension.filter(topic);
  const clusters = clusterDataTopicDimension.top(Infinity);


  masterTopicDimension.filter(topic);
  const data = masterTopicDimension.top(Infinity);

  masterSourceDimension.filter("twitter");
  let totalT = masterSourceDimension.top(Infinity);
  const Tdata = d3.nest()
    .key(d => d.infoType)
    .rollup(d => { return d.length; })
    .entries(totalT.filter(d=>d.infoType));

  masterSourceDimension.filter("weibo");
  let totalW = masterSourceDimension.top(Infinity);
  const Wdata = d3.nest()
    .key(d => d.infoType)
    .rollup(d => { return d.length; })
    .entries(totalW.filter(d=>d.infoType));

  d3.select("#noTweets").text(totalT.length);
  d3.select("#noWeibos").text(totalW.length);
  setTimeout(createBoxVis, 0, totalT.length, totalW.length, Tdata, Wdata,pieGraphPlot, barGraphSvg.attr("width")-margin.left-margin.right);

  function countTweets(clusters, tweets, freq) {
    return clusters.map(d => {
      const totalOccurances = freq.map(e => {
        if (d.words.includes(e.word)) {
          return e.frequency;
        }
        return 0;
      });
      let commulativeOcc = d3.sum(totalOccurances), tweetsLength = parseFloat(tweets.length);
      let x = commulativeOcc/parseFloat(tweetsLength);
      if (isNaN(x) || x == Infinity) {
        x = 0;
      }
      return {
            cluster_id: d.cluster_id,
            name: d.name,
            topic: d.topic,
            tweetCount: commulativeOcc,
            countFraction: x,
            words: d.words.slice()
          };
    });
  }

  freqTopicDimension.filter(topic);
  freqSourceDimension.filter("twitter");
  let freqT = freqTopicDimension.top(Infinity);
  freqSourceDimension.filter("weibo");
  let freqW = freqTopicDimension.top(Infinity);

  clustersT = countTweets(clusters, totalT, freqT);
  clustersW = countTweets(clusters, totalW, freqW);
  console.log("clusters", clustersT, clustersW);

  var max = d3.max([clustersT.length*50+20, clustersW.length*50+20]);
  bulletGraphSvg.attr("height", (max-margin.top)+"px");
  // bulletGraphSvg2.attr("height", (max+margin.top+margin.bottom)+"px");

  setTimeout(createBulletVis, 0, clustersT, clustersW, bulletGraphPlot, bulletGraphSvg.attr("width")-margin.left-margin.right);
  // setTimeout(createBulletVis, 0, clustersT, clustersW, bulletGraphPlot2, bulletGraphSvg2.attr("width")-margin.left-margin.right);
}
