var apiBaseUrl = window.location.origin + "/api";

var oldSenSentiment = [];
var splitSentences = [];

function HomeViewModel(app, dataModel) {
    var self = this;

    self.myHometown = ko.observable("");
    self.text = ko.observable("");

    self.entityTypes = ko.observableArray([]);
    self.entityTypes.push("Organization");
    self.entityTypes.push("Location");
    self.entityTypes.push("Person" );
    self.selectedOption = ko.observable("");

    self.sentimentTypes = ko.observableArray([]);
    self.sentimentTypes.push("Very Negative");
    self.sentimentTypes.push("Negative");
    self.sentimentTypes.push("Neutral");
    self.sentimentTypes.push("Positive");
    self.sentimentTypes.push("Very Positive");

    self.selectedSentimentOption = ko.observable("");

    self.sentimentSenTypes = ko.observableArray([]);

    self.selectedSenSentimentOption = ko.observableArray([]);

    self.annotationTypes = ko.observableArray([]);
    self.annotationTypes.push("default");
    self.annotationTypes.push("xml");
    self.annotationTypes.push("stanford");
    self.selectedFormatOption = ko.observable("default");

    self.Organizations = ko.observableArray([]);
    self.Locations = ko.observableArray([]);
    self.People = ko.observableArray([]);
    self.AllEntities = ko.observableArray([]);
    self.fileName = ko.observable();

    self.orgNo = 0;
    self.locNo = 0;
    self.perNo = 0;

    self.filePath = ko.observable();
    self.selectedPath = ko.observable();
    self.selectedPath("");
    self.existingFilePaths = ko.observableArray();
    self.Annotations = ko.observableArray();

    self.selectedOption.subscribe(function (newValue) {
        if (newValue !== null || newValue !== undefined) {
            self.selectedOption(newValue);
        }
    });

    self.selectedSentimentOption.subscribe(function (newValue) {
        if (newValue !== null || newValue !== undefined) {
            self.selectedSentimentOption(newValue);
        }
    });

    self.selectedFormatOption.subscribe(function (newValue) {
        if (newValue !== null || newValue !== undefined) {
            self.selectedFormatOption(newValue);
        }
    });

    self.folderFile = ko.observableArray();


    self.removeOrganization = function (org) {
        var begin = org.begin;
        var end = org.end;
        var organizations = self.Organizations();
        for (var x = 0; x < organizations.length; x++) {
            if (organizations[x].Id === org.Id) {
                self.Organizations.remove(organizations[x]);
                quill.removeFormat(begin, end - begin);
                break;
            }
        }
    };

    self.removeLocation = function (loc) {
        var begin = loc.begin;
        var end = loc.end;
        var locations = self.Locations();
        for (var x = 0; x < locations.length; x++) {
            if (locations[x].Id === loc.Id) {
                self.Locations.remove(locations[x]);
                quill.removeFormat(begin, end - begin);
                break;
            }
        }
    };

    self.removePeople = function (person) {
        var begin = person.begin;
        var end = person.end;
        var people = self.People();
        for (var x = 0; x < people.length; x++) {
            if (people[x].Id === person.Id) {
                self.People.remove(people[x]);
                quill.removeFormat(begin, end - begin);
                break;
            }
        }
    };

    self.addFilePath = function (data) {
        var selected_item = data.filePath;
        var ext = selected_item.split(".").pop();
        self.filePath(selected_item);
        if (ext !== "ann") {
            self.openAnnotatedFile(data);
            return;
        } else {
            self.fetchText(function (rsp) {
                self.text(rsp);
                quill.setContents([]);
                quill.insertText(0, rsp);
                self.getAnnotationFile(function (rsp) {
                    var response = JSON.parse(rsp);
                    var sentiment = response[0];
                    if (sentiment !== "UNK") {
                        self.selectedSentimentOption(sentiment);
                    }
                    var annotations = response[1];

                    for (var x = 0; x < annotations.length; x++) {
                        var text = quill.getText(annotations[x].begin, annotations[x].end - annotations[x].begin);
                        if (annotations[x].type === "Organization") {
                            quill.formatText(annotations[x].begin, annotations[x].end - annotations[x].begin, "color", "red");
                            quill.formatText(annotations[x].begin, annotations[x].end - annotations[x].begin, 'bold', true);
                            self.Organizations.push({ Id: orgId++, Text: text, begin: annotations[x].begin, end: annotations[x].end });
                            self.AllEntities.push({ begin: annotations[x].begin, end: annotations[x].end, type: "Organization" });
                        }
                        else if (annotations[x].type === "Location") {
                            quill.formatText(annotations[x].begin, annotations[x].end - annotations[x].begin, 'color', "blue");
                            quill.formatText(annotations[x].begin, annotations[x].end - annotations[x].begin, 'bold', true);
                            self.Locations.push({ Id: locId++, Text: text, begin: annotations[x].begin, end: annotations[x].end });
                            self.AllEntities.push({ begin: annotations[x].begin, end: annotations[x].end, type: "Location" });
                        }
                        else if (annotations[x].type === "People") {
                            quill.formatText(annotations[x].begin, annotations[x].end - annotations[x].begin, 'color', "green");
                            quill.formatText(annotations[x].begin, annotations[x].end - annotations[x].begin, 'bold', true);
                            self.People.push({ Id: perId++, Text: text, begin: annotations[x].begin, end: annotations[x].end });
                            self.AllEntities.push({ begin: annotations[x].begin, end: annotations[x].end, type: "People" });
                        }

                    }
                    $('#myModal').modal('hide');
                    $('body').removeClass('modal-open');
                    $('.modal-backdrop').remove();
                    self.Annotations(JSON.parse(rsp));
                });
            });
        }
    };

    self.fetchText = function (callback) {
        var filePath = self.filePath().replace(/\"/g, "");
        var url = apiBaseUrl + "/file/fetch?location=" + filePath;
        $.ajax({
            type: "GET",
            url: url,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (rsp) {
                if (callback) callback(rsp);
            },
            error: function () {
                alert("error");
            }
        });
    };

    self.getAnnotationFile = function (callback) {

        var filePath = self.filePath().replace(/\"/g, "");
        var url = apiBaseUrl + "/file/open?location=" + filePath;
        $.ajax({
            type: "GET",
            url: url,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (rsp) {
                if (callback) callback(rsp);
            },
            error: function () {
                alert("error");
            }
        });
    };

    Sammy(function () {
        this.get('#home', function () {
            // Make a call to the protected Web API by passing in a Bearer Authorization Header
            $.ajax({
                method: 'get',
                url: app.dataModel.userInfoUrl,
                contentType: "application/json; charset=utf-8",
                headers: {
                    'Authorization': 'Bearer ' + app.dataModel.getAccessToken()
                },
                success: function (data) {
                    self.myHometown('Your Hometown is : ' + data.hometown);
                }
            });
        });
        this.get('/', function () { this.app.runRoute('get', '#home'); });
    });

    self.loadDropdown = function () {
        $('.dropdown-toggle').dropdown();
    };


    self.auto_mentions = function (test) {
        var quillText = quill.getText();
        var url = "/advanced/suggest_em";
        var allData = {RawText: quillText};
        $.ajax({
            type: "POST",
            data: allData,
            url: apiBaseUrl + url,
            contentType: "application/x-www-form-urlencoded; charset=UTF-8",
            dataType: "json",
            success: function (rsp) {
                entries = JSON.parse(rsp);

                for (var x = 0; x < entries.length; x++) {
                    entry = entries[x];
                    begin = entry['begin'];
                    end = entry['end'];
                    // None of our types are international, so toUpperCase is sufficient for this situation                    
                    type = entry['type'].toUpperCase();
                    var text = quill.getText(begin, end - begin);
                    if (type === "ORGANIZATION") {
                        quill.formatText(begin, end - begin, "color", "red");
                        quill.formatText(begin, end - begin, 'bold', true);
                        self.Organizations.push({ Id: self.orgNo++, Text: text, begin: begin, end: end });
                        self.AllEntities.push({ begin: begin, end: end, type: "Organization" });
                    }
                    else if (type === "LOCATION") {
                        quill.formatText(begin, end - begin, 'color', "blue");
                        quill.formatText(begin, end - begin, 'bold', true);
                        self.Locations.push({ Id: self.locNo++, Text: text, begin: begin, end: end });
                        self.AllEntities.push({ begin: begin, end: end, type: "Location" });
                    }
                    else if (type === "PERSON") {
                        quill.formatText(begin, end - begin, 'color', "green");
                        quill.formatText(begin, end - begin, 'bold', true);
                        self.People.push({ Id: self.perNo++, Text: text, begin: begin, end: end});
                        self.AllEntities.push({ begin: begin, end: end, type: "People" });
                    }

                }
            },
            error: function () {
                alert("error");
            }
        });
    };

    self.auto_doc_sentiment = function (test) {
        $('#hidden_doc_sentiment').css('display', 'block');
    };

    self.apply_auto_doc_sentiment = function (test) {
        var quillText = quill.getText();
        var annotators = $("input:radio[name='annotator_group']:checked").val();
        var mode = 'document';
        var url = "/advanced/suggest_sentiment";
        var allData = { RawText: quillText, Annotators: annotators, Mode: mode};
        $.ajax({
            type: "POST",
            data: allData,
            url: apiBaseUrl + url,
            contentType: "application/x-www-form-urlencoded; charset=UTF-8",
            dataType: "json",
            success: function (rsp) {
                var values = JSON.parse(rsp);
                var first_value = values[0];
                if (first_value > 0.75) {
                    self.selectedSentimentOption('Very Positive');
                } else if (first_value < -0.75) {
                    self.selectedSentimentOption('Very Negative');
                } else if (first_value > 0.25) {
                    self.selectedSentimentOption('Positive');
                } else if (first_value < -0.25) {
                    self.selectedSentimentOption('Negative');
                } else {
                    self.selectedSentimentOption('Neutral');
                }
                $('#hidden_doc_sentiment').css('display', 'none');
            },
            error: function () {
                alert("error");
            }
        });
    };

    self.auto_sent_sentiment = function (test) {
        $('#hidden_sent_sentiment').css('display', 'block');
    };

    self.apply_auto_sent_sentiment = function (test) {
        var quillText = quill.getText();
        var sentence_based_annotators = $("input:radio[name='sentence_annotator_group']:checked").val();
        var mode = "sentence";
        var url = "/advanced/suggest_sent_sentiment";
        var allData = { RawText: quillText, Annotators: sentence_based_annotators, Mode: mode };
        $.ajax({
            type: "POST",
            data: allData,
            url: apiBaseUrl + url,
            contentType: "application/x-www-form-urlencoded; charset=UTF-8",
            dataType: "json",
            success: function (rsp) {
                var values = JSON.parse(rsp);
                for (var i = 0; i < values.length; i++) {
                    value = values[i];
                    if (value > 0.75) {
                        self.selectedSenSentimentOption()[i]('Very Positive');
                    } else if (value < -0.75) {
                        self.selectedSenSentimentOption()[i]('Very Negative');
                    } else if (value > 0.25 ) {
                        self.selectedSenSentimentOption()[i]('Positive');
                    } else if (value < -0.25) {
                        self.selectedSenSentimentOption()[i]('Negative');
                    } else {
                        self.selectedSenSentimentOption()[i]('Neutral');
                    }
                }

                $('#hidden_sent_sentiment').css('display', 'none');
            },
            error: function () {
                alert("error");
            }
        });
    }

    self.sentence_splitter = function (test) {
        var quillText = quill.getText();
        var url = "/advanced/sentence_split";
        var allData = { RawText: quillText };
        $.ajax({
            type: "POST",
            data: allData,
            url: apiBaseUrl + url,
            contentType: "application/x-www-form-urlencoded; charset=UTF-8",
            dataType: "json",
            success: function (rsp) {
                sentences = JSON.parse(rsp);
                $('#hidden_sentences').css('display', 'block');
                $('#hidden_sentences').css('border', '1px solid black');
                $('#hidden_sentences').css('overflow', 'scroll');
                $('#sentence_column').empty();
                $('#sentiment_column').empty();
                splitSentences = [sentences.length];
                oldSenSentiment = [sentences.length];
                for (var i = 0; i < sentences.length; i++) {
                    sentence = sentences[i];
                    rawText = sentence['RawText'];
                    var row = $('<div id="row_' + i + '" class="row" style="height:50px; margin-bottom: 5px;">');
                    $('#hidden_sentences').append(row);
                    var column_ta = $('<div id="col_ta_' + i + '" class="col-10">');
                    $(row).append(column_ta);
                    // create the sentence text area
                    var textArea = $('<textarea style="width: 100%; max-width: 100%; height: 100%; overflow: hidden;"/>');
                    textArea.text(rawText);
                    $(column_ta).append(textArea);
                    // create the sentiment selection drop-down for this sentence
                    self.selectedSenSentimentOption.push(ko.observable(""));
                    oldSenSentiment[i] = undefined;
                    splitSentences[i] = rawText;
                    self.selectedSenSentimentOption()[i].subscribe(function (newValue) {
                        // first we need to find which is different
                        for (var j = 0; j < oldSenSentiment.length; j++) {
                            if (oldSenSentiment[j] !== self.selectedSenSentimentOption()[j]()) {
                                // process sentence j
                                // don't necessarily need anything for this step, but we could change colors or something else
                                // update sentence j value in oldSenSentiment
                                oldSenSentiment[j] = self.selectedSenSentimentOption()[j]();
                                // one update per call, therefore we can break
                                break;
                            }
                        }
                    });
                    self.sentimentSenTypes.push(ko.observableArray([ko.observable("Very Negative"), ko.observable("Negative"), ko.observable("Neutral"), ko.observable("Positive"), ko.observable("Very Positive")]));
                    var dropdown = '<select id="sen_' + i + '" style="width: 100%; max-width: 100%; height:100%;" data-bind="options: sentimentSenTypes()[' + i + '], optionsText: $data, value: selectedSenSentimentOption()[' + i + '], optionsCaption: &#39Choose...&#39"></select>';
                    var column_sel = $('<div id="col_sel_' + i + '" class="col-2">');
                    $(row).append(column_sel);
                    $(column_sel).append(dropdown);
                    ko.applyBindings(app.Views.Home, document.getElementById('sen_' + i));
                }
            },
            error: function () {
                alert("error");
            }
        });
    };

    self.language = function (test) {
        var quillText = quill.getText();
        var url = "/advanced/language_id";
        var allData = { RawText: quillText };
        $.ajax({
            type: "POST",
            data: allData,
            url: apiBaseUrl + url,
            contentType: "application/x-www-form-urlencoded; charset=UTF-8",
            dataType: "text",
            success: function (rsp) {
                answer = JSON.parse(rsp);
                $("#doc_lang").text(answer);
            },
            error: function () {
                alert("error");
            }
        });
    };

    self.parse_html = function (test) {
        var quillText = quill.getText();
        var url = "/advanced/parse_html";
        var allData = { RawText: quillText };
        $.ajax({
            type: "POST",
            data: allData,
            url: apiBaseUrl + url,
            contentType: "application/x-www-form-urlencoded; charset=UTF-8",
            dataType: "text",
            success: function (rsp) {
                answer = JSON.parse(rsp);
                // we need to save this new text version back to disc
                self.uploadFile(answer, self.fileName(), function (rsp) {
                    self.clear();
                    quill.setText('');
                    quill.insertText(0, answer, 'normal', true);
                });
            },
            error: function () {
                alert("error");
            }
        });
    };

    self.save = function (test) {
        var quillText = quill.getText();
        var url = "/file/save";
        console.log("On Save");
        console.log(splitSentences);
        var allData = { Type: self.selectedFormatOption(), RawText: quillText, Annotations: ko.toJSON(self.AllEntities()), FileName: self.fileName(), DocumentSentiment: self.selectedSentimentOption(), SentenceSentiment: oldSenSentiment, Sentences: splitSentences};
        $.ajax({
            type: "POST",
            data: JSON.stringify(allData),
            url: apiBaseUrl + url,
            contentType: "application/json; charset=UTF-8",
            dataType: "json",
            success: function (rsp) {
                isGood = JSON.parse(rsp);
                if (!isGood) {
                    alert('WARNING: Saving of mentions and sentiment annotations was not saved.');
                } else {
                    alert('Annotation content has been saved');
                }
            },
            error: function () {
                alert("error");
            }
        });

    };

    quill.on('selection-change', function (range, oldRange, source) {
        var count = 0;
        if (range) {
            if (range.length === 0 || self.selectedOption() === "") {
                return;
            } else {
                var text = quill.getText(range.index, range.length);
                if (self.selectedOption() === "Organization") {
                    quill.format("color", "red");
                    quill.formatText(range.index, range.length, 'bold', true);
                    self.Organizations.push({ Id: self.orgNo++, Text: text, begin: range.index, end: range.index + range.length });
                    self.AllEntities.push({ begin: range.index, end: range.index + range.length, type: "Organization" });
                }
                else if (self.selectedOption() === "Location") {
                    quill.format("color", "blue");
                    quill.formatText(range.index, range.length, 'bold', true);
                    self.Locations.push({ Id: self.locNo++, Text: text, begin: range.index, end: range.index + range.length });
                    self.AllEntities.push({ begin: range.index, end: range.index + range.length, type: "Location" });
                }
                else if (self.selectedOption() === "Person") {
                    quill.format("color", "green");
                    quill.formatText(range.index, range.length, 'bold', true);
                    self.People.push({ Id: self.perNo++, Text: text, begin: range.index, end: range.index + range.length });
                    self.AllEntities.push({ begin: range.index, end: range.index + range.length, type: "Person" });
                }
            }
        } else {
            return;
        }
    });

    self.openFile = function (test, event) {
        var input = event.target;
        var reader = new FileReader();
        self.fileName(input.files[0].name);
        reader.onload = function () {
            var text = reader.result;
            quill.setText('');
            quill.insertText(0, text, 'normal', true);
            self.uploadFile(text, self.fileName(), function (rsp) {
                self.clear();
                // clear sentence variables
                self.selectedSenSentimentOption = ko.observableArray([]);
                oldSenSentiment = oldSenSentiment.length = 0;
                splitSentences = splitSentences.length = 0;
                // clear sentence div
                $('div[id^=row_]').empty();
                $('div[id^=row_]').remove();
                // hide sentence div
                $('#hidden_sentences').css('display', 'none');
            });
            $("#current_file").text(self.fileName());
        };
        reader.readAsText(input.files[0]);
    };

    self.openDirectory = function (test, event) {
        var input = event.target;

        for (var i = 0; i < input.files.length; i++) {
            var file = input.files[i];
            var reader = new FileReader();
            self.fileName(file.name);
            reader.onload = (function () {
                var text = reader.result;
                self.uploadFile(text, self.fileName(), function (rsp) {
                    self.clear();
                });
            })(file);
            //Read the image
            reader.readAsText(file);
        }
    };

    self.clear = function () {
        self.Organizations([]);
        self.Locations([]);
        self.People([]);
        orgNo = 0;
        locNo = 0;
        perNo = 0;
        self.AllEntities([]);
        quill.removeFormat(0, quill.getLength());
    };

    self.uploadFile = function (text, title, callback) {
        var url = apiBaseUrl + "/file/upload";

        //var dataObject = { text: encodeURIComponent(text), location: title};
        var dataObject = { text: text, location: title};

        $.ajax({
            type: "POST",
            url: url,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            data: JSON.stringify(dataObject),
            success: function (rsp) {
                if (callback) callback(rsp);
            },
            error: function (xhr, status, error) {
                var err = eval("(" + xhr.responseText + ")");
                alert(err.Message);
            }
        });
    };

    self.openLeftFile = function (test) {
        alert('Left Button');
    };

    self.openRightFile = function (test) {
        alert('Right Button');
    };

    self.openAnnotatedFile = function (data) {
        self.existingFilePaths([]);
        self.filePath("");
        if (data === null) {
            self.fileName("");
        } else {
            self.fileName(data.fileName);
        }

        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth() + 1; //January is 0!
        var yyyy = today.getFullYear();
        if (dd < 10) {
            dd = '0' + dd;
        }
        if (mm < 10) {
            mm = '0' + mm;
        }
        today = mm + '' + dd + '' + yyyy;

        var user = "su";
        var path = "//" + self.fileName();
        if (self.selectedPath() !== "") {
            path = self.selectedPath() + "//" + self.fileName();
        }
        //var path = "//" + today + "//" + user;

        if (data !== null) {
            self.selectedPath(self.selectedPath() + "//" + data.fileName);
        }

        var url = apiBaseUrl + "/file/list?path=" + path;
        $.ajax({
            type: "GET",
            url: url,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (rsp) {
                result = JSON.parse(rsp);
                for (var x = 0; x < result.length; x++) {
                    var n = result[x].replace(/"/g, "");
                    var test = n.split("\\").pop();
                    var ext = test.split(".").pop();

                    if (ext === "ann") {
                        self.existingFilePaths.push({ filePath: result[x], fileName: test });
                    } else if (!isNaN(ext) && ext.length === 8) {
                        // something must be different about directories
                        self.existingFilePaths.push({ filePath: result[x], fileName: test });
                    } else if (ext !== "snt" && ext !== "txt") {
                        // something must be different about directories
                        self.existingFilePaths.push({ filePath: result[x], fileName: test });
                    }

                }
                //var array = rsp.split(",");
                //for (var x = 0; x < array.length; x++) {
                //    array[x] = array[x].replace(/"/g, "");
                //    var test = array[x].split("\\").pop();
                //    if (test == "su") {
                //        self.suCount() + 1;
                //    }
                //    else if (test.split(".").pop() == 'txt' || test.split(".").pop() == 'xml' || test.split(".").pop() == 'html') {
                //        self.annFiles.push({ annTitle: test, completePath: array[x] })
                //    }
                //    else {
                //        self.datePath.push({ lastProp: test, completePath: array[x] });
                //    }

                //}
            },
            error: function () {
                alert("error");
            }
        });
    };
    //self.openAnnotatedFile();
    self.loadDropdown();
    return self;
}

app.addViewModel({
    name: "Home",
    bindingMemberName: "home",
    factory: HomeViewModel
});
