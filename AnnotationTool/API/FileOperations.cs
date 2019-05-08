using AnnotationTool.Bean;
using AnnotationTool.Models;
using AnnotationTool.NLP;
using CsvHelper;
using edu.stanford.nlp.ling;
using edu.stanford.nlp.util;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;
using System.Web.Http;
using static edu.stanford.nlp.ling.CoreAnnotations;

namespace AnnotationTool.API
{
    [RoutePrefix("api/file")]
    public class FileController : ApiController
    {
        const string Release = "release";
        const string Debug = "debug";

        IDictionary<string, string> colorDict = new Dictionary<string, string>();

        [HttpPost]
        [Route("upload")]
        public bool UploadFile(Models.Upload upload)
        {
            string user = "su";
            string todayString = DateTime.Today.ToString("MMddyyyy");
            // try some protection
            if (upload.location == null || upload.location == "")
            {
                upload.location = "sample.txt";
            }
            upload.location = upload.location.Replace("..", "").Replace("/", "_");

            try
            {
                string filePath = null;
                if (ConfigurationManager.AppSettings["environment"] == Debug)
                    filePath = System.Web.HttpContext.Current.Server.MapPath(ConfigurationManager.AppSettings["filesRoot"] + todayString + "/" + user + "/" + upload.location);
                else if (ConfigurationManager.AppSettings["environment"] == Release)
                    filePath = ConfigurationManager.AppSettings["filesRoot"] + todayString + "/" + user + "/" + upload.location;
                System.IO.FileInfo file = new System.IO.FileInfo(filePath);
                file.Directory.Create();
                using (StreamWriter rawFile = new StreamWriter(file.FullName, false))
                {
                    rawFile.WriteLine(upload.text);
                }
                return true;
            }
            catch (Exception e)
            {
                return false;
            }
        }

        [HttpGet]
        [Route("list")]
        public string ListDirectory(string path)
        {
            DirectoryInfo directory = null;
            if (ConfigurationManager.AppSettings["environment"] == Debug)
                directory = new DirectoryInfo(System.Web.HttpContext.Current.Server.MapPath(ConfigurationManager.AppSettings["filesRoot"] + path));
            if (ConfigurationManager.AppSettings["environment"] == Release)
                directory = new DirectoryInfo(ConfigurationManager.AppSettings["filesRoot"] + path);
            List<string> fullNames = new List<string>();
            foreach (DirectoryInfo dir in directory.GetDirectories())
            {
                fullNames.Add(dir.FullName);
            }
            foreach (FileInfo file in directory.GetFiles()) {
                fullNames.Add(file.FullName);
            }
            return JsonConvert.SerializeObject(fullNames);

        }

        [HttpGet]
        [Route("fetch")]
        public string FetchRawText(string location)
        {
            location = Path.ChangeExtension(location, ".txt");
            try
            {
                string fullText = File.ReadAllText(location, Encoding.UTF8);
                return fullText;
            }
            catch (Exception e)
            {
                return null;
            }
        }

        [HttpGet]
        [Route("entities")]
        public string GetConfigurationEntities()
        {
            List<EntityType> entityTypes = fetchEntityTypesFromConfiguration();
            return JsonConvert.SerializeObject(entityTypes);
        }

        [HttpGet]
        [Route("open")]
        public string OpenFile(string location)
        {
            List<object> annotationParts = new List<object>();

            // First, read sentiment file.  It is ok for it to not exist
            try
            {
                var sentimentLocation = Path.ChangeExtension(location, ".snt");
                string[] sentimentLines = File.ReadAllLines(sentimentLocation);
                string sentiment = sentimentLines[0];
                annotationParts.Add(sentiment);
            } catch (Exception e)
            {
                annotationParts.Add("UNK");
            }

            // Second read the ann file
            //===========================================
            // Read configuration for entity types first
            List<EntityType> entityTypes = fetchEntityTypesFromConfiguration();

            try {
                string[] allLines = File.ReadAllLines(location);
                string formatLine = allLines[1];
                var formatPattern = @"###FORMAT: ([A-Za-z]+) ###";
                var match = Regex.Match(formatLine, formatPattern);
                string format = match.Groups[1].Value;
                if (format == "default")
                {
                    List<Annotation> annotations = new List<Annotation>();
                    for (int index = 2; index < allLines.Length; index++)
                    {
                        EntityMention em = EntityMention.FromString(allLines[index]);
                        Annotation ann = new Annotation();
                        ann.begin = em.begin;
                        ann.end = em.end;
                        ann.type = em.type;
                        ann.color = colorDict[ann.type];
                        annotations.Add(ann);
                    }
                    annotationParts.Add(annotations);
                    return JsonConvert.SerializeObject(annotationParts);
                } else if (format == "xml")
                {
                    List<Annotation> annotations = new List<Annotation>();
                    string fulltext = String.Concat(new List<string>(allLines).GetRange(2, allLines.Length).ToArray());
                    var inlinePattern = BuildEntityTypePattern(entityTypes);
                    Regex inlineRegex = new Regex(inlinePattern);
                    int xmlJunkOffset = 0;
                    foreach (Match inlineMatch in inlineRegex.Matches(fulltext))
                    {
                        string text = match.Value;
                        int begin = match.Index;
                        int end = inlineMatch.Length - begin;
                        Annotation ann = new Annotation();
                        ann.begin = begin - xmlJunkOffset;
                        ann.end = end - xmlJunkOffset;
                        SetAnnotationType(ann, entityTypes, text);
                        ann.color = colorDict[ann.type];
                    }
                    annotationParts.Add(annotations);
                    return JsonConvert.SerializeObject(annotationParts);
                }
                else {
                    return null;
                }

            } catch (Exception e)
            {
                return null;
            }
        }

        [HttpPost]
        [Route("save")]
        public bool SaveFile(Models.Document document)
        {
            if(document.Type == null)
            {
                document.Type = "default";
            }
            return TransformAnnotationDocument(document);
        }

        private bool TransformAnnotationDocument(Models.Document doc)
        {
            string text = doc.RawText;
            string type = doc.Type;

            string user = "su";
            string todayString = DateTime.Today.ToString("MMddyyyy");
            string originalFilename = doc.FileName;

            //*****************************************************************************

            // Here we write to file the chosen DocumentSentiment which has one format
            string sentiment = doc.DocumentSentiment;
            var newSentimentFilename = Path.ChangeExtension(originalFilename, ".snt");

            try
            {
                string filePath = null;
                if (ConfigurationManager.AppSettings["environment"] == Debug)
                    filePath = System.Web.HttpContext.Current.Server.MapPath(ConfigurationManager.AppSettings["filesRoot"] + todayString + "/" + user + "/" + newSentimentFilename);
                else if (ConfigurationManager.AppSettings["environment"] == Release)
                    filePath = ConfigurationManager.AppSettings["filesRoot"] + todayString + "/" + user + "/" + newSentimentFilename;
                System.IO.FileInfo file = new System.IO.FileInfo(filePath);
                file.Directory.Create();
                using (StreamWriter sentFile = new StreamWriter(file.FullName, false))
                {
                    sentFile.WriteLine(sentiment);
                }
            }
            catch (Exception e)
            {
                // Don't know what to do in this case
            }

            //*****************************************************************************

            // Here we write to file the chosen Sentence-level sentiment which has different format
            List<string> senSentiment = doc.SentenceSentiment;
            List<string> docSentences = doc.Sentences;
            var newSentenceSentimentFilename = Path.ChangeExtension(originalFilename, ".csv");

            try
            {
                string filePath = null;
                if (ConfigurationManager.AppSettings["environment"] == Debug)
                    filePath = System.Web.HttpContext.Current.Server.MapPath(ConfigurationManager.AppSettings["filesRoot"] + todayString + "/" + user + "/" + newSentenceSentimentFilename);
                else if (ConfigurationManager.AppSettings["environment"] == Release)
                    filePath = ConfigurationManager.AppSettings["filesRoot"] + todayString + "/" + user + "/" + newSentenceSentimentFilename;
                System.IO.FileInfo file = new System.IO.FileInfo(filePath);
                file.Directory.Create();

                using (StreamWriter sentFile = new StreamWriter(file.FullName, false))
                {
                    var writer = new CsvWriter(sentFile);
                    writer.Configuration.Delimiter = ",";

                    // Write the header
                    writer.WriteField("Sentiment");
                    writer.WriteField("Sentence");
                    writer.NextRecord();

                    for (int sen = 0; sen < senSentiment.Count; sen++)
                    {
                        var sentence = docSentences[sen];
                        var senSen = senSentiment[sen];
                        if (senSen == null)
                        {
                            writer.WriteField("Unknown");
                        }
                        else
                        {
                            writer.WriteField(senSen);
                        }
                        writer.WriteField(sentence);
                        writer.NextRecord();
                    }
                }
            }
            catch (Exception e)
            {
                // Don't know what to do in this case
            }

            //*****************************************************************************

            // Process the user entered annotations

            string annotations = doc.Annotations == null || doc.Annotations == "" ? "" : doc.Annotations;
            List<Annotation> clientAnnotations = JsonConvert.DeserializeObject<List<Annotation>>(annotations);
            if (clientAnnotations != null)
            {
                clientAnnotations.Sort(delegate (Annotation ca1, Annotation ca2)
                {
                    return ca1.begin.CompareTo(ca2.begin);
                });
            }

            // Here we write to file with the chosen annotation type

            if (type == "default")
            {
                var newFilename = Path.ChangeExtension(originalFilename, ".ann");
                List<EntityMention> ems = new List<EntityMention>();
                if (clientAnnotations != null)
                {
                    foreach (Annotation clientAnnotation in clientAnnotations)
                    {
                        EntityMention em = new EntityMention();
                        em.begin = clientAnnotation.begin;
                        em.end = clientAnnotation.end;
                        em.type = clientAnnotation.type;
                        em.text = text.Substring(clientAnnotation.begin, clientAnnotation.end - clientAnnotation.begin);
                        ems.Add(em);
                    }
                }

                try
                {
                    string filePath = null;
                    if (ConfigurationManager.AppSettings["environment"] == Debug)
                        filePath = System.Web.HttpContext.Current.Server.MapPath(ConfigurationManager.AppSettings["filesRoot"] + todayString + "/" + user + "/" + newFilename);
                    if (ConfigurationManager.AppSettings["environment"] == Release)
                        filePath = ConfigurationManager.AppSettings["filesRoot"] + todayString + "/" + user + "/" + newFilename;
                    System.IO.FileInfo file = new System.IO.FileInfo(filePath);
                    file.Directory.Create();
                    using (StreamWriter annFile = new StreamWriter(file.FullName, false))
                    {
                        annFile.WriteLine("###THIS IS A COMMENT BLOCK###");
                        annFile.WriteLine("###FORMAT: " + type + " ###");
                        foreach (EntityMention em in ems)
                        {
                            annFile.WriteLine(em);
                        }
                    }
                    return true;
                }
                catch (Exception e)
                {
                    return false;
                }
            } else if (type == "xml")
            {
                var newFilename = Path.ChangeExtension(originalFilename, ".xml");
                string fulltext = "";
                int currentLocation = 0;
                if (clientAnnotations != null)
                {
                    foreach (Annotation clientAnnotation in clientAnnotations)
                    {
                        int begin = clientAnnotation.begin;
                        int end = clientAnnotation.end;
                        string entityType = clientAnnotation.type;
                        fulltext += text.Substring(currentLocation, begin - currentLocation);
                        fulltext += "<" + entityType + ">";
                        fulltext += text.Substring(begin, end - begin);
                        fulltext += "</" + entityType + ">";
                        currentLocation = end;
                    }
                    fulltext += text.Substring(currentLocation);
                }

                try
                {
                    string filePath = null;
                    if (ConfigurationManager.AppSettings["environment"] == Debug)
                        filePath = System.Web.HttpContext.Current.Server.MapPath(ConfigurationManager.AppSettings["filesRoot"] + todayString + "/" + user + "/" + newFilename);
                    if (ConfigurationManager.AppSettings["environment"] == Release)
                        filePath = ConfigurationManager.AppSettings["filesRoot"] + todayString + "/" + user + "/" + newFilename;
                    System.IO.FileInfo file = new System.IO.FileInfo(filePath);
                    file.Directory.Create();
                    using (StreamWriter xmlFile = new StreamWriter(file.FullName, false))
                    {
                        xmlFile.WriteLine("###THIS IS A COMMENT BLOCK###");
                        xmlFile.WriteLine("###FORMAT: " + type + " ###");
                        xmlFile.WriteLine(fulltext);
                    }
                }
                catch (Exception e)
                {
                    return false;
                }
                return true;

            } else if (type == "stanford")
            {
                var newFilename = Path.ChangeExtension(originalFilename, ".conll");
                string fulltext = "";
                int clientAnnotationNumber = 0;
                int clientAnnotationSize = 0;
                Annotation clientAnnotation = null;
                int clientAnnotationBegin = Int32.MaxValue;
                int clientAnnotationEnd = Int32.MaxValue;
                string clientAnnotationType = "";
                if (clientAnnotations != null && clientAnnotations.Count > 0)
                {
                    clientAnnotationSize = clientAnnotations.Count;
                    clientAnnotation = clientAnnotations[0];
                    clientAnnotationBegin = clientAnnotation.begin;
                    clientAnnotationEnd = clientAnnotation.end;
                    clientAnnotationType = clientAnnotation.type;
                }
                edu.stanford.nlp.pipeline.Annotation document = new edu.stanford.nlp.pipeline.Annotation(text);
                PipelineDispenser.StanfordPipeline.annotate(document);
                List<CoreMap> sentences = JavaExtensions.ToList<CoreMap>((java.util.List)document.get(typeof(SentencesAnnotation)));
                foreach (CoreMap sentence in sentences)
                {
                    List<CoreLabel> tokens = JavaExtensions.ToList<CoreLabel>((java.util.List)document.get(typeof(TokensAnnotation)));
                    foreach (CoreLabel token in tokens)
                    {
                        int tokenBegin = token.beginPosition();
                        int tokenEnd = token.endPosition();
                        string chosenNer = "O";
                        if (isContainedIn(tokenBegin, tokenEnd, clientAnnotationBegin, clientAnnotationEnd))
                        {
                            chosenNer = clientAnnotationType;
                            if (tokenEnd == clientAnnotationEnd)
                            {
                                clientAnnotationNumber++;
                                if (clientAnnotationNumber < clientAnnotationSize)
                                {
                                    clientAnnotation = clientAnnotations[clientAnnotationNumber];
                                    clientAnnotationBegin = clientAnnotation.begin;
                                    clientAnnotationEnd = clientAnnotation.end;
                                    clientAnnotationType = clientAnnotation.type;
                                }
                            }
                        }
                        fulltext += (token.value() + " " + chosenNer + Environment.NewLine);
                    }
                    fulltext += Environment.NewLine;
                }

                try
                {
                    string filePath = null;
                    if (ConfigurationManager.AppSettings["environment"] == Debug)
                        filePath = System.Web.HttpContext.Current.Server.MapPath(ConfigurationManager.AppSettings["filesRoot"] + todayString + "/" + user + "/" + newFilename);
                    if (ConfigurationManager.AppSettings["environment"] == Debug)
                        filePath = ConfigurationManager.AppSettings["filesRoot"] + todayString + "/" + user + "/" + newFilename;
                    System.IO.FileInfo file = new System.IO.FileInfo(filePath);
                    file.Directory.Create();
                    using (StreamWriter conllFile = new StreamWriter(file.FullName, false))
                    {
                        conllFile.WriteLine("###THIS IS A COMMENT BLOCK###");
                        conllFile.WriteLine("###FORMAT: " + type + " ###");
                        conllFile.WriteLine(fulltext);
                    }
                }
                catch (Exception e)
                {
                    return false;
                }
                return true;
            }
            else if (type == "luis")
            {
                var newFilename = Path.ChangeExtension(originalFilename, ".lou");
                string fulltext = "";
                if (clientAnnotations != null)
                {
                    foreach (Annotation clientAnnotation in clientAnnotations)
                    {
                        EntityMention em = new EntityMention();
                        em.begin = clientAnnotation.begin;
                        em.end = clientAnnotation.end - 1;
                        em.type = clientAnnotation.type;
                        fulltext += (
                            "{" +
                            "\"entity\": \"" + em.type
                            + "\", \"startPos\": " + em.begin
                            + ", \"endPos\": " + em.end
                            + "}," + "\n"
                            );
                    }
                }

                try
                {
                    string filePath = null;
                    if (ConfigurationManager.AppSettings["environment"] == Debug)
                        filePath = System.Web.HttpContext.Current.Server.MapPath(ConfigurationManager.AppSettings["filesRoot"] + todayString + "/" + user + "/" + newFilename);
                    if (ConfigurationManager.AppSettings["environment"] == Release)
                        filePath = ConfigurationManager.AppSettings["filesRoot"] + todayString + "/" + user + "/" + newFilename;
                    System.IO.FileInfo file = new System.IO.FileInfo(filePath);
                    file.Directory.Create();
                    using (StreamWriter annFile = new StreamWriter(file.FullName, false))
                    {
                        annFile.WriteLine("###THIS IS A COMMENT BLOCK###");
                        annFile.WriteLine("###FORMAT: " + type + " ###");
                        annFile.WriteLine(fulltext);
                    }
                    return true;
                }
                catch (Exception e)
                {
                    return false;
                }
            }
            else
            {
                return false;
            }
        }

        private bool isContainedIn(int bin, int ein, int bspan, int espan)
        {
            return (bin >= bspan && ein <= espan);
        }

        private string BuildEntityTypePattern(List<EntityType> entityTypes)
        {
            string pattern = @"(";
            for (int index = 0; index < entityTypes.Count; index++)
            {
                pattern += "(<";
                pattern += entityTypes[index].Type;
                pattern += "?.+</";
                pattern += entityTypes[index].Type;
                pattern += ">)";
                if (index != entityTypes.Count - 1)
                {
                    pattern += " | ";
                }
            }
            pattern += ")";
            return pattern;
        }

        private int SetAnnotationType(Annotation ann, List<EntityType> entityTypes, string match)       
        {
            string strippedMatch = match.Replace("<", "");
            strippedMatch = strippedMatch.Substring(0, strippedMatch.IndexOf(">"));
            string value = match.Replace(strippedMatch, "").Replace("<", "").Replace(">", "").Replace("/", "");
            ann.type = "";
            foreach (EntityType eType in entityTypes)
            {
                if (strippedMatch == eType.Type)
                {
                    ann.type = value;
                    return 2 * strippedMatch.Length + 5;
                }
            }
            return 0;
        }

        private List<EntityType> fetchEntityTypesFromConfiguration()
        {
            string[] entityTypeLines = File.ReadAllLines(System.Web.HttpContext.Current.Server.MapPath("~/admin/entity_types.txt"));
            List<EntityType> entityTypes = new List<EntityType>();
            foreach (string entityTypeLine in entityTypeLines)
            {
                string[] parts = entityTypeLine.Split('\t');
                EntityType et = new EntityType();
                et.Id = Convert.ToInt32(parts[0]);
                et.Type = parts[1];
                et.Color = parts[2];
                colorDict[parts[1]] = parts[2];
                entityTypes.Add(et);
            }
            return entityTypes;
        }
    }
}