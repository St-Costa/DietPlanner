module.exports = {
    messageBoxUpdate: function messageBoxUpdate(messageBoxDiv, messageText, messageBool){
        let boxColor = ""
        
        if(messageBool){
            boxColor = "#8cff69";
        }
        else if (!messageBool){
            boxColor = "#ff2b2b";
        }
    
        messageBoxDiv.style.color = boxColor;
        messageBoxDiv.textContent = messageText;
        messageBoxDiv.style.border = '1px solid ' + boxColor;
        messageBoxDiv.style.fontWeight = 'bold';
        
        setTimeout(function(){
            messageBoxDiv.textContent = '';
            messageBoxDiv.style.color = "";
            messageBoxDiv.style.border = '1px none';
        }, 3000);
    }
    
}

