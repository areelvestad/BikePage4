// Photoshop Script to Batch Resize and Save Images

// Function to resize and save the image while maintaining aspect ratio
function resizeAndSave(file, sizes, outputFolder) {
    var originalName = file.name.split('.')[0];
    for (var i = 0; i < sizes.length; i++) {
        var newWidth = sizes[i];
        
        // Open the document
        var doc = app.open(file);
        
        // Calculate the new height while maintaining aspect ratio
        var originalWidth = doc.width.as('px');
        var originalHeight = doc.height.as('px');
        var aspectRatio = originalHeight / originalWidth;
        
        var newHeight = newWidth * aspectRatio;

        // Resize the image
        doc.resizeImage(UnitValue(newWidth, 'px'), undefined, undefined, ResampleMethod.BICUBIC);

        // Prepare the save options
        var saveOptions = new JPEGSaveOptions();
        saveOptions.quality = 8;

        // Save the file
        var saveFile = new File(outputFolder + '/' + originalName + '_' + newWidth + '.jpg');
        doc.saveAs(saveFile, saveOptions, true, Extension.LOWERCASE);
        
        // Close the document without saving
        doc.close(SaveOptions.DONOTSAVECHANGES);
    }
}

// Function to select folders and process images
function processFolders() {
    // Select the folder with the images
    var inputFolder = Folder.selectDialog("Select the folder with images to resize");
    if (inputFolder == null) return;

    // Select the output folder
    var outputFolder = Folder.selectDialog("Select the folder to save resized images");
    if (outputFolder == null) return;

    // Define the widths to which images should be resized
    var sizes = [350, 930]; // Example sizes, you can add more

    // Get all the files in the input folder
    var files = inputFolder.getFiles(function(file) {
        return file instanceof File && file.name.match(/\.(jpg|jpeg|png|tif)$/i);
    });

    // Process each file
    for (var i = 0; i < files.length; i++) {
        resizeAndSave(files[i], sizes, outputFolder);
    }

    alert("Batch resizing and saving completed!");

    // Ask to choose a new folder or cancel
    var continueProcessing = confirm("Do you want to process another folder?");
    if (continueProcessing) {
        processFolders();
    } else {
        alert("Process completed.");
    }
}

// Run the processFolders function
processFolders();
