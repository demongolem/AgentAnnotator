set CSC=C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc
%CSC% /target:library /out:LanguageIdentifier.dll LanguageIdentifier\*.cs
%CSC% ParseWikipedia\ParseWikipedia.cs LanguageIdentifier\*.cs
%CSC% CompileDistro\CompileDistro.cs LanguageIdentifier\*.cs
%CSC% TestLanguageIdentifier\TestLanguageIdentifier.cs LanguageIdentifier\*.cs
%CSC% Accuracy\Accuracy.cs
