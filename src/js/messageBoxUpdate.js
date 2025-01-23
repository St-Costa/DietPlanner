module.exports = {
    errorHandling: function errorHandling(messageBoxDiv, resultOfCall, message){
        messageBoxUpdate(messageBoxDiv, message, resultOfCall);
    }
}

const disappearingTime_ms = 3000;
const progressBar = ['ooo', 'oo', 'o'];

function messageBoxUpdate(messageBoxDiv, messageText, messageBool){
    let boxColor = ""
    if(messageBool){
        boxColor = "#8cff69";
    }
    else if (!messageBool){
        boxColor = "#ff2b2b";
    }

    messageBoxDiv.style.color = boxColor;
    messageBoxDiv.textContent = messageText;
    messageBoxDiv.style.border = '1px solid' + boxColor;
    messageBoxDiv.style.fontWeight = 'bold';
    messageBoxDiv.style.height = 'fit-content';


    // Filter error message
    let splitText = messageText.toString().split(">");
    messageText = splitText.length > 1 ? splitText[1] : messageText;

    // Create close button
    let closeButton = document.createElement('span');
    closeButton.textContent = 'ⓧ';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '3px';
    closeButton.style.right = '10px';
    messageBoxDiv.style.position = 'relative';
    closeButton.style.cursor = 'pointer';
    closeButton.onclick = function() {
        messageBoxDiv.textContent = '';
        messageBoxDiv.style.color = "";
        messageBoxDiv.style.border = '1px none';
    };

    // Show time before disappearing
    let timeDiv = document.createElement('span');
    timeDiv.style.color = boxColor;
    timeDiv.style.fontSize = '10px';
    timeDiv.style.position = 'absolute';
    timeDiv.style.top = '-12px';
    timeDiv.style.right = '0px';
    // Show progress
    let remainingTime = disappearingTime_ms / 1000;
    timeDiv.textContent = progressBar[0];
    let countdownInterval = setInterval(() => {
        remainingTime--;
        if (remainingTime > 0) {
            timeDiv.textContent = progressBar[progressBar.indexOf(timeDiv.textContent) + 1];
        } else {
            clearInterval(countdownInterval);
        }
    }, disappearingTime_ms/progressBar.length);
    
    // Append close button to message box
    messageBoxDiv.appendChild(closeButton);
    messageBoxDiv.appendChild(timeDiv);

    setTimeout(function(){
        messageBoxDiv.textContent = '';
        messageBoxDiv.style.color = "";
        messageBoxDiv.style.border = '1px none';
    }, disappearingTime_ms);
}
