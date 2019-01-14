using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace AnnotationTool.Models
{
    public class Document
    {
        public string Type { get; set; }
        public string RawText { get; set; }
        public string Annotations { get; set; }
        public string FileName { get; set; }
        public string DocumentSentiment { get; set; }
        public List<string> SentenceSentiment { get; set; }
        public List<string> Sentences { get; set; }
    }
}