using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace AnnotationTool.Bean
{
    public class EntityMention
    {
        public string text;
        public string type;
        public int begin;
        public int end;

        public static EntityMention FromString(String line)
        {
            string[] parts = line.Split('\t');
            EntityMention em = new EntityMention();
            em.begin = Convert.ToInt32(parts[2]);
            em.end = Convert.ToInt32(parts[3]);
            em.text = parts[0];
            em.type = parts[1];
            return em;
        }

        public override string ToString()
        {
            return text + "\t" + type + "\t" + begin + "\t" + end;
        }
    }
}