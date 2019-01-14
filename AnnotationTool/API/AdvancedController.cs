﻿using AngleSharp.Extensions;
using AngleSharp.Parser.Html;
using AnnotationTool.Bean;
using AnnotationTool.Models;
using AnnotationTool.NLP;
using edu.stanford.nlp.pipeline;
using edu.stanford.nlp.util;
using java.lang;
using LanguageIdentification;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Web.Http;
using static edu.stanford.nlp.ling.CoreAnnotations;

namespace AnnotationTool.API
{
 
    [RoutePrefix("api/advanced")]
    public class AdvancedController : ApiController
    {
        [HttpPost]
        [Route("sentence_split")]
        public string SplitSentences(Models.Text doc)
        {
            List<Models.Text> toReturn = new List<Models.Text>();
            string fulltext = doc.RawText;
            edu.stanford.nlp.pipeline.Annotation document = new edu.stanford.nlp.pipeline.Annotation(fulltext);
            PipelineDispenser.GetNewPipeline().annotate(document);
            List<CoreMap> sentences = JavaExtensions.ToList<CoreMap>((java.util.List)document.get(typeof(SentencesAnnotation)));
            foreach (CoreMap sentence in sentences)
            {
                Models.Text sentenceObject = new Models.Text();
                sentenceObject.RawText = (string)sentence.get(typeof(TextAnnotation));
                toReturn.Add(sentenceObject);
            }
            return JsonConvert.SerializeObject(toReturn);
        }

        [HttpPost]
        [Route("language_id")]
        public string IdentifyLanguage(Models.Text doc)
        {
            string text = doc.RawText;
            var li = LanguageIdentifier.New(AppDomain.CurrentDomain.BaseDirectory + "/classifiers/LangId/langprofiles-word-1_5-nfc-10k.bin.gz", "Vector", -1);
            var lang = li.Identify(text);  // Calling the language identifier -- it 
            return lang;
        }

        [HttpPost]
        [Route("parse_html")]
        public string ParseHtml(Models.Text doc)
        {
            string fulltext = doc.RawText;
            if (fulltext.StartsWith("<body>"))
            {
                string newFullText = "";
                var parser = new HtmlParser();
                var htmlDocument = parser.Parse(fulltext);
                var paragraphCssSelector = htmlDocument.QuerySelectorAll("p");
                foreach (var item in paragraphCssSelector)
                {
                    newFullText += item.Text() + Environment.NewLine;
                }
                fulltext = newFullText;
            }
            return fulltext;
        }

        [HttpPost]
        [Route("suggest_em")]
        public string SuggestEntityMentions(Models.Text doc)
        {
            string fulltext = doc.RawText;
            edu.stanford.nlp.pipeline.Annotation document = new edu.stanford.nlp.pipeline.Annotation(fulltext);
            PipelineDispenser.GetNewPipeline().annotate(document);
            List<CoreMap> entityMentions = JavaExtensions.ToList<CoreMap>((java.util.List)document.get(typeof(MentionsAnnotation)));
            List<Bean.Annotation> annotations = new List<Bean.Annotation>();
            foreach (CoreMap entityMention in entityMentions)
            {
                Bean.Annotation annotation = new Bean.Annotation();
                annotation.begin = ((Integer)entityMention.get(typeof(CharacterOffsetBeginAnnotation))).intValue();
                annotation.end = ((Integer)entityMention.get(typeof(CharacterOffsetEndAnnotation))).intValue();
                annotation.type = (string)entityMention.get(typeof(NamedEntityTagAnnotation));
                annotations.Add(annotation);
            }
            return JsonConvert.SerializeObject(annotations);
        }

        [HttpPost]
        [Route("suggest_sentiment")]
        public async System.Threading.Tasks.Task<string> SuggestSentimentAsync(Models.Sentiment doc)
        {
            List<double> values = new List<double>();
            // we need to call the sentiment web service here.  the location should be configured externally
            var url = ConfigurationManager.AppSettings["SentimentServiceUrl"];
            using (var client = new HttpClient()) {
                //set up client
                client.BaseAddress = new Uri(url);
                client.DefaultRequestHeaders.Clear();
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                client.Timeout = TimeSpan.FromMinutes(10);

                var nvc = new List<KeyValuePair<string, string>>();
                var texts = doc.RawText;
                var annotators = doc.Annotators;
                nvc.Add(new KeyValuePair<string, string>("texts", texts));
                if (annotators.StartsWith("composite"))
                {
                    // We need to adjust this as necessary for the correct variety of composite
                    if ("composite_c" == annotators) {
                        nvc.Add(new KeyValuePair<string, string>("preset", "no_lstm"));
                    }
                    else if ("composite_b" == annotators)
                    {
                        nvc.Add(new KeyValuePair<string, string>("preset", "rule_based"));
                    }
                    else
                    {
                        // this is really composite_a, but it should also serve as the catch-all
                        nvc.Add(new KeyValuePair<string, string>("preset", "all"));
                    }
                    annotators = "composite";
                }
                else
                {
                    nvc.Add(new KeyValuePair<string, string>("preset", "all"));
                }
                // we need to eventually pass in which annotator we are using
                string fullUrl = url + "/" + annotators;

                var req = new HttpRequestMessage(HttpMethod.Post, fullUrl) {
                    Content = new FormUrlEncodedContent(nvc)
                };

                var response = await client.SendAsync(req);
                if (!response.IsSuccessStatusCode)
                {
                    values.Add(System.Double.NaN);

                } else  if ("finance" == annotators) {
                    // We get back a pair, positive and negative.  We could try to report both back or we could try to generate a single score
                    // Right now we choose option 2
                    var final_value = 0.0;
                    var result = await response.Content.ReadAsStringAsync();
                    var parts = result.Split('\t');
                    final_value += double.Parse(parts[0]) * 0.05 - double.Parse(parts[1]) * 0.05;
                    if (final_value > 1.0)
                    {
                        final_value = 1.0;
                    }
                    else if (final_value < -1.0)
                    {
                        final_value = -1.0;
                    }
                    values.Add(final_value);
                }
                else if ("google" == annotators || "stanford" == annotators || "aylien" == annotators || "charlstm" == annotators
                    || "composite_a" == annotators || "composite_b" == annotators || "composite_c" == annotators)
                {
                    var result = await response.Content.ReadAsStringAsync();
                    List<double> valueList = JsonConvert.DeserializeObject<List<double>>(result);
                    values.Add(valueList[0]);
                }
                else
                {
                    var result = await response.Content.ReadAsStringAsync();
                    values.Add(double.Parse(result));
                }
            }
            // now once we have values, we will return them to the annotation view.
            return JsonConvert.SerializeObject(values);
        }

        [HttpPost]
        [Route("suggest_sent_sentiment")]
        public async System.Threading.Tasks.Task<string> SuggestSentenceSentimentAsync(Models.Sentiment doc)
        {
            List<double> values = new List<double>();
            // we need to call the sentiment web service here.  the location should be configured externally
            var url = ConfigurationManager.AppSettings["SentimentServiceUrl"];
            using (var client = new HttpClient())
            {
                //set up client
                client.BaseAddress = new Uri(url);
                client.DefaultRequestHeaders.Clear();
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                client.Timeout = TimeSpan.FromMinutes(10);

                var nvc = new List<KeyValuePair<string, string>>();
                var texts = doc.RawText;
                var annotators = doc.Annotators;
                var mode = doc.Mode;
                nvc.Add(new KeyValuePair<string, string>("texts", texts));
                nvc.Add(new KeyValuePair<string, string>("preset", "all"));
                nvc.Add(new KeyValuePair<string, string>("mode", mode));

                // we need to eventually pass in which annotator we are using
                string fullUrl = url + "/" + annotators;

                var req = new HttpRequestMessage(HttpMethod.Post, fullUrl)
                {
                    Content = new FormUrlEncodedContent(nvc)
                };

                var response = await client.SendAsync(req);
                if (!response.IsSuccessStatusCode)
                {
                    values.Add(System.Double.NaN);

                }
                else if ("stanford" == annotators)
                {
                    var result = await response.Content.ReadAsStringAsync();
                    List<double> valueList = JsonConvert.DeserializeObject<List<double>>(result);
                    values.AddRange(valueList);
                }
            }
            // now once we have values, we will return them to the annotation view.
            return JsonConvert.SerializeObject(values);
        }

        [System.Web.Http.HttpPost]
        [System.Web.Http.Route("generate_entities")]
        public string SuggestEntities(Models.Document document)
        {
            HashSet<Entity> entities = new HashSet<Entity>();
            string text = document.RawText;
            string annotations = document.Annotations == null || document.Annotations == "" ? "" : document.Annotations;
            List<Bean.Annotation> clientAnnotations = JsonConvert.DeserializeObject<List<Bean.Annotation>>(annotations);
            if (clientAnnotations != null)
            {
                HashSet<string> seenEntities = new HashSet<string>();
                foreach (Bean.Annotation clientAnnotation in clientAnnotations)
                {
                    string type = clientAnnotation.type;
                    string annotationText = text.Substring(clientAnnotation.begin, clientAnnotation.end).ToLower();
                    string expandedAnnotationText = type + "\t" + annotationText;
                    if (clientAnnotation.end < 500)
                    {
                        if (!PersonExclude(annotationText, type))
                        {
                            Entity ent = new Entity();
                            ent.text = annotationText;
                            ent.type = type;
                            entities.Add(ent);
                        }
                    } else
                    {
                        if (!seenEntities.Contains(expandedAnnotationText))
                        {
                            seenEntities.Add(expandedAnnotationText);
                        } else
                        {
                            if (!PersonExclude(annotationText, clientAnnotation.type))
                            {
                                Entity ent = new Entity();
                                ent.text = annotationText;
                                ent.type = type;
                                entities.Add(ent);
                            }
                        }
                    }
                }
            }
            return JsonConvert.SerializeObject(entities);
        }

        private bool PersonExclude(string entity, string type)
        {
            return type == "Person" && !entity.Contains(" ");
        }
    }
}