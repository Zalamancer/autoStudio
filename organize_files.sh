#!/bin/bash

# Function to move and rename files
move_file() {
    local source="$1"
    local dest_folder="$2"
    local new_name="$3"
    
    if [ -f "$source" ]; then
        mkdir -p "$dest_folder"
        mv "$source" "$dest_folder/$new_name" 2>/dev/null
    fi
}

# 1. PHONEMES AND MOUTH ANIMATION FILES
echo "Organizing phonemes and mouth animations..."
mkdir -p "03_Phonemes_and_Mouth_Animation/Mouth_Assets"
mkdir -p "03_Phonemes_and_Mouth_Animation/Speech_Phonemes"

# Mouth and lips files
for file in lips.svg mouthSheet.png mouthanimation.jpg mouth-animation.zip; do
    [ -f "$file" ] && mv "$file" "03_Phonemes_and_Mouth_Animation/Mouth_Assets/" 2>/dev/null
done

# Phoneme SVG files - keep in Speech_Phonemes subfolder
for file in A,E,I.svg B,M,P.svg C,D,N,S,T,X,Y,Z.svg CH,J,SH.svg Ee.svg F,V.svg G,K.svg L.svg O.svg Q,W.svg TH.svg U.svg; do
    [ -f "$file" ] && mv "$file" "03_Phonemes_and_Mouth_Animation/Speech_Phonemes/" 2>/dev/null
done

# 2. FACE EXPRESSIONS AND EMOTION SHEETS
echo "Organizing face expressions..."
mkdir -p "02_Face_Expressions/Emotion_Sheets"
mkdir -p "02_Face_Expressions/Face_Templates"
mkdir -p "02_Face_Expressions/Expression_Tests"

# Emotion sheets
for emotion in anger disgust fear joy sadness surprise neutral happy; do
    # Sheet files
    [ -f "${emotion} sheet.png" ] && mv "${emotion} sheet.png" "02_Face_Expressions/Emotion_Sheets/emotion_${emotion}_sheet.png" 2>/dev/null
    [ -f "${emotion} square.png" ] && mv "${emotion} square.png" "02_Face_Expressions/Emotion_Sheets/emotion_${emotion}_square.png" 2>/dev/null
    [ -f "${emotion} square low.png" ] && mv "${emotion} square low.png" "02_Face_Expressions/Emotion_Sheets/emotion_${emotion}_square_low.png" 2>/dev/null
    [ -f "${emotion}.png" ] && mv "${emotion}.png" "02_Face_Expressions/Emotion_Sheets/emotion_${emotion}_single.png" 2>/dev/null
done

# Emotion intensity levels
for emotion in angry happy sad neutral surprised disgusted; do
    for level in 1 2 3 4; do
        [ -f "${emotion}_lvl${level}.png" ] && mv "${emotion}_lvl${level}.png" "02_Face_Expressions/Emotion_Sheets/emotion_${emotion}_level${level}.png" 2>/dev/null
    done
done

# Face template files
for file in face.png face_final.png facefinal.jpg face_outline.png face_ratio.png face_intensity.png face_blank.png "face sheet.png" "face sheet tutorial.png" facesheet.svg facesheet1.png; do
    [ -f "$file" ] && mv "$file" "02_Face_Expressions/Face_Templates/" 2>/dev/null
done

# Face trial and test files
for file in "face trial.png" "face trial sheeet.png" faceNoFaceTrial.png "facemouth sheet trial.png"; do
    [ -f "$file" ] && mv "$file" "02_Face_Expressions/Expression_Tests/" 2>/dev/null
done

# Other face reference files
for file in faces\ reference.png faces\ sheet\ aspect\ ratio.png faces2.jpg "empty faces.png" "face chart" "faceChart.png"; do
    [ -f "$file" ] && mv "$file" "02_Face_Expressions/Face_Templates/" 2>/dev/null
done

# Face split and test variants
for file in facesplit2.png facessplit.png "face split test" secondfaces2.jpg secondsheet.jpg secondsheet.ai secondsheetexample.jpg upscaledfaces.png; do
    [ -f "$file" ] && mv "$file" "02_Face_Expressions/Expression_Tests/" 2>/dev/null
done

# 3. CHARACTER DESIGN - Occupations/Professions
echo "Organizing character design files..."
mkdir -p "01_Character_Design/Character_Professions"
mkdir -p "01_Character_Design/Historical_Characters"
mkdir -p "01_Character_Design/Character_Emotion_Grids"

# Character professions (2D)
for profession in astronaut baker barista blacksmith "business man" businessman chef clown "construction worker" cowboy "delivery driver" detective doctor electrician farmer firefighter fisherman "flight attendant" "forensic scientist" gardener hazmat\ worker "hotel staff" janitor judge knight lawyer magician mailman nurse painter paramedic pilot pirate "police officer" priest "prison guard" prisoner professor roman\ soldier royalguard sailor samurai scientist "security guard" "ship captain" soldier teacher "train conductor" waiter; do
    [ -f "${profession}.jpg" ] && mv "${profession}.jpg" "01_Character_Design/Character_Professions/character_${profession// /_}.jpg" 2>/dev/null
done

# Historical characters
for file in Archaeologist.jpg "Medieval Peasant.jpg" Musketeer.jpg "Spartan Warrior.jpg"; do
    [ -f "$file" ] && mv "$file" "01_Character_Design/Historical_Characters/" 2>/dev/null
done

# Character emotion grids
for file in "character_emotion_grid.png" "character_emotion_grid (1).png"; do
    [ -f "$file" ] && mv "$file" "01_Character_Design/Character_Emotion_Grids/" 2>/dev/null
done

# 4. 3D MODELS
echo "Organizing 3D models..."
mkdir -p "04_3D_Models/Character_Models"
mkdir -p "04_3D_Models/Outfit_Models"

# Character models (.glb files)
for file in *.glb; do
    if [ -f "$file" ]; then
        # Categorize by type
        if [[ "$file" == *"character"* ]] || [[ "$file" == *"warrior"* ]] || [[ "$file" == *"soldier"* ]] || [[ "$file" == *"knight"* ]]; then
            mv "$file" "04_3D_Models/Character_Models/" 2>/dev/null
        else
            mv "$file" "04_3D_Models/Outfit_Models/" 2>/dev/null
        fi
    fi
done

# 5. LEARNING MATERIALS
echo "Organizing learning materials..."
mkdir -p "05_Learning_Materials/Comics_and_Storytelling"
mkdir -p "05_Learning_Materials/Linear_Algebra"

# Comics books
for file in "Making Comics Storytelling Secrets of Comics, Manga and Graphic Novels (Scott McCloud) (Z-Library).epub" Making_Comics.pdf "Understanding Comics_text.pdf" "ilide.info-the-comic-books-scott-mccloud-reinventing-comics-how-imagination-and-techn-pr_13913354f6185602cd7da6ecb750047b.pdf"; do
    [ -f "$file" ] && mv "$file" "05_Learning_Materials/Comics_and_Storytelling/" 2>/dev/null
done

# Linear Algebra
for file in "Linear Algebra week"*.pdf; do
    [ -f "$file" ] && mv "$file" "05_Learning_Materials/Linear_Algebra/" 2>/dev/null
done

# 6. GENERATED ASSETS
echo "Organizing generated assets..."
mkdir -p "06_Generated_Assets/Gemini_AI_Generated"
mkdir -p "06_Generated_Assets/Downloaded_Tools"

# Gemini generated images
for file in gemini*.jpg gemini*.svg; do
    if [ -f "$file" ]; then
        mv "$file" "06_Generated_Assets/Gemini_AI_Generated/" 2>/dev/null
    fi
done

# Tool downloads and archives
for file in PineTools.com*.png PineTools.com*.zip "generation_"*.zip "character_assets.zip" "cut_images_archive_"*.zip; do
    if [ -f "$file" ]; then
        mv "$file" "06_Generated_Assets/Downloaded_Tools/" 2>/dev/null
    fi
done

# 7. MISCELLANEOUS
echo "Organizing misc files..."
mkdir -p "07_Miscellaneous/Reference_Images"
mkdir -p "07_Miscellaneous/Test_Files"
mkdir -p "07_Miscellaneous/Design_Elements"

# Reference and test images
for file in IMG_0162.JPG image.png hatching.png rotate.png gpt\ guide.png; do
    [ -f "$file" ] && mv "$file" "07_Miscellaneous/Reference_Images/" 2>/dev/null
done

# Test files and untitled
for file in *.png *.jpg *.jpeg; do
    if [ -f "$file" ] && [[ "$file" == *"Untitled"* || "$file" == *"download"* || "$file" == *"row-"* || "$file" == *"deneme"* || "$file" == *"tocut"* || "$file" == *"test"* || "$file" == *"transparent"* ]]; then
        mv "$file" "07_Miscellaneous/Test_Files/" 2>/dev/null
    fi
done

# Design elements and misc
for file in Odyssey.dmg elevenlabs.txt settings.local.json secondsheet.ai newpage.png image_part_*.png style1.png hopefully\ good\ rez.png mostrecent.jpg final_second.jpg "background to be removed.png" "background to be removed-Photoroom.png" *.dmg *.txt *.json; do
    [ -f "$file" ] && mv "$file" "07_Miscellaneous/Design_Elements/" 2>/dev/null
done

echo "Organization complete!"
