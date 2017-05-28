class Data {
  constructor(d, source, topic) {
    this.classificationId = d.classificationId;
    this.topic = topic;
    this.infoType = d.infoType;
    this.source = source;
    this.freqWords = d3.set(d.freqWords);

    if (source == "twitter") {
      this.text = d.text;
      this.time = new Date(d.created_at);
    }
    if (source == "weibo") {
      this.text = d.postText;
      this.time = new Date(parseInt(d.time));
    }
  }

  getOccurances(str) {
    
  }
}
