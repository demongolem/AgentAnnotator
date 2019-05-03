var apiBaseUrl = window.location.origin + "/api";

var oldSenSentiment = [];
var splitSentences = [];

var stateMode = 1;

$(document).ready(function () {
    var url = apiBaseUrl + "/file/entities";
    $.ajax({
        type: "GET",
        url: url,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (rsp) {
            result = JSON.parse(rsp);
            for (var x = 0; x < result.length; x++) {
                var Id = result[x].Id;
                var Type = result[x].Type 
                // and here we draw on the screen
                $('#entity_block').append('<div style="margin-bottom:10px;">    <h4 class="" style="display:inline-block">' + Type + 's:</h4>    <span data-bind="foreach: AllEntities">        <span data-bind="if: type == \'' + Type + '\'">        <span class="label label-danger" style="font-size:12px; margin-right:5px; margin-bottom:5px;" data-bind="event: { mouseenter: $parent.findEntity, mouseleave: $parent.leaveEntity } ">            <span data-bind="text: Text"></span>            <span class="glyphicon glyphicon-remove" data-bind="click: $parent.removeEntity"></span>        </span>        </span>    </span></div>');
                // and here we populate the dropdown
                app.Views.Home.entityTypes.push(Type);
            }
            // and apply bindings to knockout, this is essential
            ko.cleanNode(document.getElementById('entity_block'));
            ko.applyBindings(app.Views.Home, document.getElementById('entity_block'));
        },
        error: function () {
            alert("error");
        }
    });

});

applyMode();

function turnOnWait() {
    $("body").css("cursor", "progress");
}

function turnOffWait() {
    $("body").css("cursor", "default");
}

function applyMode() {
    if (stateMode === 1) {
        // only have buttons 0, 1 and 2 enabled
        $('#button0').prop('disabled', false);
        $('#button1').prop('disabled', false);
        $('#button2').prop('disabled', false);
        $('#button3').prop('disabled', true);
        $('#button4').prop('disabled', true);
        $('#button5').prop('disabled', true);
        $('#button6').prop('disabled', true);
        $('#button7').prop('disabled', true);
        $('#button8').prop('disabled', true);
        $('#button9').prop('disabled', true);
        $('#button10').prop('disabled', true);
        $('#button11').prop('disabled', true);
        $('#button12').prop('disabled', true);
        $('#button13').prop('disabled', true);
    } else if (stateMode === 2) {
        // have all buttons except sentence sentiment enabled
        $('#button0').prop('disabled', false);
        $('#button1').prop('disabled', false);
        $('#button2').prop('disabled', false);
        $('#button3').prop('disabled', false);
        $('#button4').prop('disabled', false);
        $('#button5').prop('disabled', false);
        $('#button6').prop('disabled', false);
        $('#button7').prop('disabled', true);
        $('#button8').prop('disabled', false);
        $('#button9').prop('disabled', false);
        $('#button10').prop('disabled', false);
        $('#button11').prop('disabled', false);
        $('#button12').prop('disabled', false);
        $('#button13').prop('disabled', false);
    } else if (stateMode === 3) {
        // have all buttons enabled
        $('#button0').prop('disabled', false);
        $('#button1').prop('disabled', false);
        $('#button2').prop('disabled', false);
        $('#button3').prop('disabled', false);
        $('#button4').prop('disabled', false);
        $('#button5').prop('disabled', false);
        $('#button6').prop('disabled', false);
        $('#button7').prop('disabled', false);
        $('#button8').prop('disabled', false);
        $('#button9').prop('disabled', false);
        $('#button10').prop('disabled', false);
        $('#button11').prop('disabled', false);
        $('#button12').prop('disabled', false);
        $('#button13').prop('disabled', false);
    } else {
        console.log("Unidentified mode " + stateMode);
    }
}

function HomeViewModel(app, dataModel) {
    var self = this;

    self.myHometown = ko.observable("");
    self.text = ko.observable("");

    self.entityTypes = ko.observableArray([]);
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
    self.annotationTypes.push("luis");
    self.selectedFormatOption = ko.observable("default");

    self.AllEntities = ko.observableArray([]);
    self.fileName = ko.observable();

    self.entityNo = 0;

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

    self.findEntity = function (ent) {
        var begin = org.begin;
        var end = org.end;
        quill.formatText(begin, end - begin, "background-color", "yellow");
    };

    self.leaveEntity = function (ent) {
        var begin = org.begin;
        var end = org.end;
        quill.formatText(begin, end - begin, "background-color", "white");
    };

    self.removeEntity = function (ent) {
        var begin = ent.begin;
        var end = ent.end;
        var entities = self.AllEntities();
        for (var x = 0; x < entities.length; x++) {
            if (entities[x].Id === ent.Id) {
                self.AllEntities.remove(entities[x]);
                quill.removeFormat(begin, end - begin);
                break;
            }
        }
    }

    self.insertEntity = function (new_entity) {
        var new_begin = parseInt(new_entity['begin']);
        var new_end = parseInt(new_entity['end']);
        var entities = self.AllEntities();
        var insert_point = entities.length;
        if (insert_point === 0) {
            self.AllEntities.push(new_entity);
            return;
        }
        for (var x = 0; x < entities.length; x++) {
            var this_ent = entities[x]
            var this_begin = this_ent.begin;
            var this_end = this_ent.end;
            if (this_begin > new_begin) {
                insert_point = x;
                break;
            }
        }
        self.AllEntities.splice(insert_point, 0, new_entity);
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
                        var new_entity = {};
                        if (annotations[x].type === "ORGANIZATION") {
                            quill.formatText(annotations[x].begin, annotations[x].end - annotations[x].begin, "color", "red");
                            quill.formatText(annotations[x].begin, annotations[x].end - annotations[x].begin, 'bold', true);
                            new_entity = { Id: self.entityNo++, Text: text, begin: annotations[x].begin, end: annotations[x].end, type: "ORGANIZATION" };
                            self.insertEntity(new_entity);
                        }
                        else if (annotations[x].type === "LOCATION") {
                            quill.formatText(annotations[x].begin, annotations[x].end - annotations[x].begin, 'color', "blue");
                            quill.formatText(annotations[x].begin, annotations[x].end - annotations[x].begin, 'bold', true);
                            new_entity = { Id: self.entityNo++, Text: text, begin: annotations[x].begin, end: annotations[x].end, type: "LOCATION" };
                            self.insertEntity(new_entity);
                        }
                        else if (annotations[x].type === "PERSON") {
                            quill.formatText(annotations[x].begin, annotations[x].end - annotations[x].begin, 'color', "green");
                            quill.formatText(annotations[x].begin, annotations[x].end - annotations[x].begin, 'bold', true);
                            new_entity = { Id: self.entityNo++, Text: text, begin: annotations[x].begin, end: annotations[x].end, type: "PERSON" };
                            self.insertEntity(new_entity);
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
                    var new_entity;
                    if (type === "ORGANIZATION") {
                        quill.formatText(begin, end - begin, "color", "red");
                        quill.formatText(begin, end - begin, 'bold', true);
                        new_entity = { Id: self.entityNo++, Text: text, begin: begin, end: end, type: "ORGANIZATION" };
                        self.insertEntity(new_entity);
                    }
                    else if (type === "LOCATION") {
                        quill.formatText(begin, end - begin, 'color', "blue");
                        quill.formatText(begin, end - begin, 'bold', true);
                        new_entity = { Id: self.entityNo++, Text: text, begin: begin, end: end, type: "LOCATION" };
                        self.insertEntity(new_entity);
                    }
                    else if (type === "PERSON") {
                        quill.formatText(begin, end - begin, 'color', "green");
                        quill.formatText(begin, end - begin, 'bold', true);
                        new_entity = { Id: self.entityNo++, Text: text, begin: begin, end: end, type: "PERSON" };
                        self.insertEntity(new_entity);
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
        var allData = { RawText: quillText, Annotators: annotators, Mode: mode };
        turnOnWait();
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
                turnOffWait();
            },
            error: function () {
                alert("error");
                turnOffWait();
            }
        });
    };

    self.auto_entity_sentiment = function (test) {
        $('#hidden_entity_sentiment').css('display', 'block');
    };

    self.apply_auto_entity_sentiment = function (test) {
        var quillText = quill.getText();
        var annotators = $("input:radio[name='entity_annotator_group']:checked").val();
        var mode = 'entity';
        var url = "/advanced/suggest_entity_sentiment";
        var allData = { RawText: quillText, Annotators: annotators, Mode: mode };
        turnOnWait();
        $.ajax({
            type: "POST",
            data: allData,
            url: apiBaseUrl + url,
            contentType: "application/x-www-form-urlencoded; charset=UTF-8",
            dataType: "json",
            success: function (rsp) {
                $('#entity_sentiment_scores tbody').empty();
                var values = JSON.parse(rsp);
                for (var key in values) {
                    var first_value = values[key];
                    var rating = '';
                    if (first_value > 0.75) {
                        rating = 'Very Positive';
                    } else if (first_value < -0.75) {
                        rating = 'Very Negative';
                    } else if (first_value > 0.25) {
                        rating = 'Positive';
                    } else if (first_value < -0.25) {
                        rating = 'Negative';
                    } else {
                        rating = 'Neutral';
                    }
                    $('#entity_sentiment_scores > tbody:last-child').append('<tr><td>' + key + '</td><td>' + rating + '</td></tr>');
                }
                turnOffWait();
            },
            error: function () {
                alert("error");
                turnOffWait();
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
        turnOnWait();
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
                    } else if (value > 0.25) {
                        self.selectedSenSentimentOption()[i]('Positive');
                    } else if (value < -0.25) {
                        self.selectedSenSentimentOption()[i]('Negative');
                    } else {
                        self.selectedSenSentimentOption()[i]('Neutral');
                    }
                }

                $('#hidden_sent_sentiment').css('display', 'none');
                turnOffWait();
            },
            error: function () {
                alert("error");
                turnOffWait();
            }
        });
    };

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
                stateMode = 3;
                applyMode();
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

    self.topics = function (test) {
        var quillText = quill.getText();
        var url = "/advanced/show_topics";
        var allData = { RawText: quillText };
        $.ajax({
            type: "POST",
            data: allData,
            url: apiBaseUrl + url,
            contentType: "application/x-www-form-urlencoded; charset=UTF-8",
            dataType: "text",
            success: function (rsp) {
                answer = JSON.parse(rsp);
                $("#doc_topic_1").text(answer);
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

    self.spell_correct = function (test) {
        var quillText = quill.getText();
        var url = "/advanced/spell_correct";
        var allData = { RawText: quillText };
        $.ajax({
            type: "POST",
            data: allData,
            url: apiBaseUrl + url,
            contentType: "application/x-www-form-urlencoded; charset=UTF-8",
            dataType: "text",
            success: function (rsp) {
                alert('Implement Me!');
                console.log(rsp);
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
                var new_entity = {};
                if (self.selectedOption() === "ORGANIZATION") {
                    quill.format("color", "red");
                    quill.formatText(range.index, range.length, 'bold', true);
                    new_entity = { Id: self.entityNo++, Text: text, begin: range.index, end: range.index + range.length, type: "ORGANIZATION" };
                    self.insertEntity(new_entity);
                }
                else if (self.selectedOption() === "LOCATION") {
                    quill.format("color", "blue");
                    quill.formatText(range.index, range.length, 'bold', true);
                    new_entity = { Id: self.entityNo++, Text: text, begin: range.index, end: range.index + range.length, type: "LOCATION" };
                    self.insertEntity(new_entity);
                }
                else if (self.selectedOption() === "PERSON") {
                    quill.format("color", "green");
                    quill.formatText(range.index, range.length, 'bold', true);
                    new_entity = { Id: self.entityNo++, Text: text, begin: range.index, end: range.index + range.length, type: "PERSON" };
                    self.insertEntity(new_entity);
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
            stateMode = 2;
            applyMode();
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
        self.entityNo = 0;
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

                stateMode = 2;
                applyMode();

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
