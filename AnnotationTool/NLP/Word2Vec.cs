using java.util;
using System;
using System.Collections.Generic;
using Word2Vec.Net;

namespace AnnotationTool.NLP
{
    public class Word2Vec
    {

        public static void TrainModel()
        {
            string trainfile = AppDomain.CurrentDomain.BaseDirectory + "\\wordvec\\my_train_data.txt";
            string outputFileName = AppDomain.CurrentDomain.BaseDirectory + "\\wordvec\\my_output_model.bin";
            var word2Vec = Word2VecBuilder.Create()
                .WithTrainFile(trainfile)// Use text data to train the model;
                .WithOutputFile(outputFileName)//Use to save the resulting word vectors / word clusters
                .WithSize(200)//Set size of word vectors; default is 100
                .WithSaveVocubFile(AppDomain.CurrentDomain.BaseDirectory + "/wordvec/noisy.txt")//The vocabulary will be saved to <file>
                .WithDebug(2)//Set the debug mode (default = 2 = more info during training)
                .WithBinary(1)//Save the resulting vectors in binary moded; default is 0 (off)
                .WithCBow(1)//Use the continuous bag of words model; default is 1 (use 0 for skip-gram model)
                .WithAlpha(0.05f)//Set the starting learning rate; default is 0.025 for skip-gram and 0.05 for CBOW
                .WithWindow(7)//Set max skip length between words; default is 5
                .WithSample((float)1e-3)//Set threshold for occurrence of words. Those that appear with higher frequency in the training data twill be randomly down-sampled; default is 1e-3, useful range is (0, 1e-5)
                .WithHs(0)//Use Hierarchical Softmax; default is 0 (not used)
                .WithNegative(5)//Number of negative examples; default is 5, common values are 3 - 10 (0 = not used)
                .WithThreads(5)//Use <int> threads (default 12)
                .WithIter(5)//Run more training iterations (default 5)
                .WithMinCount(5)//This will discard words that appear less than <int> times; default is 5
                .WithClasses(0)//Output word classes rather than word vectors; default number of classes is 0 (vectors are written)
                .Build();

            word2Vec.TrainModel();
        }

        public static BestWord[] TestModel(string text)
        {
            var distance = new Distance(AppDomain.CurrentDomain.BaseDirectory + "/wordvec/glove.6B.100d.bin");
            var result = distance.Search(text);
            return result;
        }
    }
}