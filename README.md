# AgentAnnotator
A very robust semi-automated annotation tool for those having to annotate NLP aspects of documents.  It is developed in C#.

This project has a dependency on another sentiment rest api that I have developed MultilevelSentiment (https://github.com/demongolem/MultilevelSentiment/) to perform sentiment analysis on documents, sentences or entities as required.

If we are using the sentiment piece as well, we have to make sure that version of CoreNLP used for each one is the same.  At the present moment, AgentAnnotator uses 3.9.1.

Starting with version 0.2, we have a dependency on https://github.com/eabdullin/Word2Vec.Net.  This provides us word vector capability for some of our new features, first of which is spelling correction.  I had to manually build a NuGet package, as there was none available from that project.  There is an issue there, https://github.com/eabdullin/Word2Vec.Net/issues/19, which requests a NuGet package be made available.

# Version History
| Version       | About           | Date       |
| ------------- |:---------------:| ----------:|
| 0.1           | Initial Release | 01/17/2019 |
