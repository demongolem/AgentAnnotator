using System;
using System.Collections.Generic;
using System.Text;
using System.IO;
using System.Diagnostics;
using System.Linq;

namespace LanguageIdentification {
  public class TestLanguageIdentifier {
    public static void Main(string[] args) {
      if (args.Length != 5 && args.Length != 7) {
        Console.Error.WriteLine("Usage: TestLanguageIdentifier liSpec cap distros.bin.gz [wiki|twit|none] tests.txt [nfolds fold]");
        Console.Error.WriteLine("where liSpec: Vector     -- cosine similarity of gram vectors");
        Console.Error.WriteLine("              Likely     -- probability of last char of trigram conditioned on prefix");
        Console.Error.WriteLine("              LikelySp   -- probability of last char of trigram conditioned on prefix, smart prior");
        Console.Error.WriteLine("              LikelyAp   -- probability of last char of trigram conditioned on prefix, additive prior");
        Console.Error.WriteLine("              Rank,rs    -- rank corr; rs = sf|sr|kt");
        Console.Error.WriteLine("      cap indicates how many grams per language to load (-1 means use all)");
        Console.Error.WriteLine("      distros.bin.gz is the file containing language profiles procuded by CompileDistros");
        Console.Error.WriteLine("      tests.txt contains a list of test file names, one per language, each file name of the form xx_*,");
        Console.Error.WriteLine("           where xx is the ISO 639-1 language code");
        Console.Error.WriteLine("      nfolds (optionally) indicates the number of folds for n-fold cross validation");
        Console.Error.WriteLine("      fold (optionally) indicates the number of the fold to test on");
      } else {
        var sw = Stopwatch.StartNew();
        var li = LanguageIdentifier.New(args[2], args[0], int.Parse(args[1]));
        var cleaner = Cleaning.MakeCleaner(args[3]);
        var nfolds = args.Length == 5 ? -1 : int.Parse(args[5]);
        var fold = args.Length == 5 ? -1 : int.Parse(args[6]);

        var confusionMatrix = new Dictionary<string, long>();
        var set = new HashSet<string>();
        foreach (var pair in LabeledData.Read(args[4], nfolds, fold, false)) {
          var lang = li.Identify(cleaner(pair.text));  // Calling the language identifier -- it all happens here!
          if (pair.lang == "") continue;
          var key = lang + "\t" + pair.lang;
          set.Add(lang);
          set.Add(pair.lang);
          if (!confusionMatrix.ContainsKey(key)) confusionMatrix[key] = 0;
          confusionMatrix[key]++;
        }
        var langs = set.OrderBy(x => x).ToArray();
        for (int i = 0; i < langs.Length; i++) {
          Console.Write("\t{0}", langs[i]);
        }
        Console.WriteLine();
        for (int j = 0; j < langs.Length; j++) {
          Console.Write(langs[j]);
          for (int i = 0; i < langs.Length; i++) {
            Console.Write("\t{0}", Lookup(confusionMatrix, langs[j] + "\t" + langs[i]));
          }
          Console.WriteLine();
        }
        Console.Error.WriteLine("Done. Job took {0} seconds", sw.ElapsedMilliseconds * 0.001);
      }
    }
    private static long Lookup(Dictionary<string, long> distro, string key) {
      long res = 0;
      distro.TryGetValue(key, out res);
      return res;
    }
  }
}
