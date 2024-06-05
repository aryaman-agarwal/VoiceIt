function onOpen() {
  const ui = DocumentApp.getUi();
  ui.createMenu('VoiceIt')
    .addItem('Convert Text to MP3', 'userInput')
    .addToUi()
}
function userInput() {
  const ui = DocumentApp.getUi();
  let language = 'default';
  const translate = ui.alert('VoiceIt', 'Do you want the text to be translated?', ui.ButtonSet.YES_NO_CANCEL);
  if (translate === ui.Button.YES) {
    const langResponse = ui.prompt('VoiceIt', 'Please enter the language you would like the audio to be in:', ui.ButtonSet.OK_CANCEL);
    if (langResponse.getSelectedButton() === ui.Button.OK) {
      language = langResponse.getResponseText();
    } else {
      ui.alert('No language entered. Proceeding with the default language of the text.');
    }
  }
  const nameResponse = ui.prompt('VoiceIt', 'Please enter a file name for your audio:', ui.ButtonSet.OK_CANCEL);
  if (nameResponse.getSelectedButton() === ui.Button.OK) {
    const fileName = nameResponse.getResponseText();

    const voiceResponse = ui.prompt('VoiceIt',
      'Please choose a style of voice:\n' +
      'Alloy - Robust, authoritative\n' +
      'Echo - Ethereal, soft\n' +
      'Fable - Narrative, warm\n' +
      'Onyx - Bold, deep\n' +
      'Nova - Clear, vibrant\n' +
      'Shimmer - Light, melodic', ui.ButtonSet.OK_CANCEL);
    if (voiceResponse.getSelectedButton() === ui.Button.OK) {
      const voiceStyle = voiceResponse.getResponseText();
      ui.alert('Process initiated with your settings.');
      convertTextToSpeech(language, fileName, voiceStyle);
    } else {
      ui.alert('Invalid voice style!');
    }
  } else {
    ui.alert('Invalid file name!');
  }
}

function convertTextToSpeech(language, fileName, voiceStyle) {
  var doc = DocumentApp.getActiveDocument();
  let body = doc.getBody().getText();
  if (language != 'default') {
    const GPT_API = "{API_KEY}";
    const BASE_URL = "https://api.openai.com/v1/chat/completions";

    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GPT_API}`
    };

    const options = {
      headers,
      method: "POST",
      muteHttpExceptions: true,
      payload: JSON.stringify({
        "model": "gpt-3.5-turbo",
        "messages": [{
          "role": "system",
          "content": "You will be provided with text and convert it into the language mentioned by the user. Translate it exactly how it is written and do not correct any kind of mistakes"
        },
        {
          "role": "user",
          "content": `${language}, ${body}`
        }
        ],
        "temperature": 0.5
      })
    }
    const response = JSON.parse(UrlFetchApp.fetch(BASE_URL, options));
    body = response.choices[0].message.content
   doc.getBody().appendParagraph(body);
  }

  const apiKey = '{API_KEY}';
  const apiEndpoint = 'https://api.openai.com/v1/audio/speech';
  const payload = JSON.stringify({
    model: "tts-1",
    input: body,
    voice: `${voiceStyle.toLowerCase()}`,
    format: "mp3"
  });

  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json'
    },
    payload: payload,
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(apiEndpoint, options);
  if (response.getResponseCode() == 200) {
    var blob = response.getBlob();
    var file = DriveApp.createFile(blob.setName(`${fileName}`+'.mp3'));
    Logger.log('Audio file created and saved to Google Drive.');
    DocumentApp.getUi().alert('Audio file created and saved to Google Drive. Here is the link: ' + file.getUrl());
  } else {
    var jsonResponse = JSON.parse(response.getContentText());
    Logger.log('Error converting text to speech: ' + jsonResponse.error.message);
    DocumentApp.getUi().alert('Failed to convert text to speech.');
  }
}
