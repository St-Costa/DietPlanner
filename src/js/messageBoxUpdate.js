module.exports = {
    errorHandling: function errorHandling(messageBoxDiv, resultOfCall, message){
        messageBoxUpdate(messageBoxDiv, message, resultOfCall);
    }

    
}

function messageBoxUpdate(messageBoxDiv, messageText, messageBool){
    let boxColor = ""
    
    if(messageBool){
        boxColor = "#8cff69";
    }
    else if (!messageBool){
        boxColor = "#ff2b2b";
    }

    // Filter error message
    let splitText = messageText.toString().split(">");
    messageText = splitText.length > 1 ? splitText[1] : messageText;

    messageBoxDiv.style.color = boxColor;
    messageBoxDiv.textContent = messageText;
    messageBoxDiv.style.border = '1px solid ' + boxColor;
    messageBoxDiv.style.fontWeight = 'bold';

    messageBoxDiv.style.height = 'fit-content';
    
    setTimeout(function(){
        messageBoxDiv.textContent = '';
        messageBoxDiv.style.color = "";
        messageBoxDiv.style.border = '1px none';
    }, 50000);
}