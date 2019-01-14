using java.util;
using System.Collections.Generic;

public static class JavaExtensions
{

    public static IEnumerable<T> ToIEnumerable<T>(this java.util.List list)
    {
        if (list != null)
        {
            java.util.Iterator itr = list.iterator();

            while (itr.hasNext())
            {
                yield return (T)itr.next();
            }
        }
    }

    public static List<T> ToList<T>(this java.util.List list)
    {
        List<T> newList = new List<T>();
        if (list != null)
        {
            for (int index = 0; index < list.size(); index++) {
                newList.Add((T) list.get(index));
            }
        }
        return newList;
    }

    public static HashSet<T> toHashSet<T>(this java.util.Set set)
    {
        HashSet<T> newSet = new HashSet<T>();
        if (set != null)
        {
            Iterator setIterator = set.iterator();
            while (setIterator.hasNext())
            {
                newSet.Add((T)setIterator.next());
            }
        }
        return newSet;
    }

}