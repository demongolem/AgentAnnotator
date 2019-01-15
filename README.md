# AgentAnnotator
A very robust semi-automated annotation tool for those having to annotate NLP aspects of documents.  It is developed in C#.

This project has a dependency on another sentiment rest api that I have developed MultilevelSentiment (https://github.com/demongolem/MultilevelSentiment/) to perform sentiment analysis on documents as required.

If we are using the sentiment piece as well, we have to make sure that version of CoreNLP used for each one is the same.  At the present moment, AgentAnnotator uses 3.9.1.
