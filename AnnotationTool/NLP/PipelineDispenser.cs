using edu.stanford.nlp.pipeline;
using java.util;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;

namespace AnnotationTool.NLP
{
    public class PipelineDispenser
    {
        public const string DefaultStanfordVersion = "3.8.0";

        public static StanfordCoreNLP StanfordPipeline { get; set; }

        public static StanfordCoreNLP GetNewPipeline()
        {

            Directory.SetCurrentDirectory(AppDomain.CurrentDomain.BaseDirectory + "/classifiers/" + DefaultStanfordVersion);

            if (StanfordPipeline != null)
            {
                return StanfordPipeline;
            }

            Properties props = new Properties();

            string annotatorString = "tokenize, ssplit, pos, lemma, ner, entitymentions";

            props.put("ner.model", "edu/stanford/nlp/models/ner/english.all.3class.distsim.crf.ser.gz");
            props.put("ner.applyNumericClassifiers", "false");
            props.put("ner.useSUTime", "false");
            props.put("ner.applyFineGrained", "false");
            props.put("maxAdditionalKnownLCWords", "0");

            props.setProperty("annotators", annotatorString);

            StanfordPipeline = new StanfordCoreNLP(props);
            return StanfordPipeline;
        }


    }

}