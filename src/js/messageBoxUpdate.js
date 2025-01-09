module.exports = {
    errorHandling: function errorHandling(messageBoxDiv, resultOfCall){
       switch(resultOfCall){
            case 'file-not-found':
                messageBoxUpdate(messageBoxDiv,'File not found!', false);
                break;
            case 'delete-file-success':
                messageBoxUpdate(messageBoxDiv,'File deleted!', true);
                break;
            case 'delete-file-failure':
                messageBoxUpdate(messageBoxDiv,'Failed to delete file!', false);
                break;
            case 'file-update-success':
                messageBoxUpdate(messageBoxDiv,'File updated!', true);
                break;
            case 'file-update-failure':
                messageBoxUpdate(messageBoxDiv,'Failed to update file!', false);
                break;
            case 'file-exists':
                messageBoxUpdate(messageBoxDiv,'File already exists!', false);
                break;
            case 'create-file-success':
                messageBoxUpdate(messageBoxDiv,'File created!', true);
                break;
            case 'create-file-failure':
                messageBoxUpdate(messageBoxDiv,'Failed to create file!', false);
                break;
            case 'invalid-file-content':
                messageBoxUpdate(messageBoxDiv,'Invalid file content!', false);
                break;
            
       }
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

    messageBoxDiv.style.color = boxColor;
    messageBoxDiv.textContent = messageText;
    messageBoxDiv.style.border = '1px solid ' + boxColor;
    messageBoxDiv.style.fontWeight = 'bold';
    
    setTimeout(function(){
        messageBoxDiv.textContent = '';
        messageBoxDiv.style.color = "";
        messageBoxDiv.style.border = '1px none';
    }, 1000);
}