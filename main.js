var config = {
    type: Phaser.AUTO,
    width: 1050,
    height: 600,
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

let game = new Phaser.Game(config);

let bg;
let bg_dimmed;

let orangeColor = Phaser.Display.Color.HexStringToColor("#f47c3c").color;

let welcomeText;

let coreTempTitle;
let coreTempText;
let coreTempTextbg;
let powerOutputTitle;
let powerOutputText;
let powerOutputTextbg;
let neutronCounterTitle;
let neutronCounterText;
let neutronCounterTextbg;

let debugK;
let debugSf;
let debugSk;
let debugR;

let controlRodSlider;
let sliderTextLeft;
let sliderTextRight;
let sliderTitle;

let timeSliderbg;
let timeSlider;
let timeSliderTitle;
let timeSliderText100x;
let timeSliderText10x;
let timeSliderText1x;
let timeSliderText01x;
let timeSliderText001x;


let geigerBeepEffect = document.getElementById("geigerAudioElem");

let centerX;
let centerY;
let sliderMiddle;

let controlRodPercentage = 0;
let deltaTime;
let K, Sf, t = 0, N = 3.2 * Math.pow(10,19), dt = 0, L = 0.1, R = 0;
let deltaN;
let power;

let showDebug = false;
let firstScene = true;

function preload () {
    //Baggrundsbillede taget fra https://www.vecteezy.com/
    this.load.image('background', 'assets/img/reactorcitybg.jpg');
    this.load.image("dimmed_background", "assets/img/reactorcitybgdimmed.jpg");

    this.load.image("timesliderbg", "assets/img/timesliderbg.png");
    this.load.image("sliderbg", "assets/img/sliderbg.png");
    this.load.image("sliderbox", "assets/img/smallbox.png");
    this.load.audio("geigerbeep", ["assets/audio/geigercounter.wav"]);
}

function create () {
    //Gem koordinater til centrum af skærmen
    centerX = this.cameras.main.width / 2;
    centerY = this.cameras.main.height / 2;
    
    //Baggrund
    bg_dimmed = this.add.image(0, 0, 'dimmed_background').setOrigin(0, 0);

    //Tips
    this.add.text(10, 10, 'Tryk på "D" for at vise og skjule debug-info!', { font: "15px Courier", color: "white", align: "left"});

    //Tegn skyder for kontrolstænger
    this.add.image(centerX, 525, "sliderbg");
    controlRodSlider = this.add.image(centerX + 2, 525, "sliderbox");
    sliderTextLeft = this.add.text(165, 510, "ind", { font: "25px Arial", color: "black", align: "center"});
    sliderTextRight = this.add.text(852, 509, "ud", { font: "25px Arial", color: "black", align: "center"});
    sliderTitle = this.add.text(centerX, 450, "Kontrolstænger", { font: "35px Arial", color: "black", align: "center"}).setOrigin(0.5);

    //Tegn skyder for tidsskridtsstørrelse
    timeSliderbg = this.add.image(1000, centerY, "timesliderbg");
    timeSliderbg.angle = 90;
    timeSliderbg.setScale(0.5);
    timeSliderTitle = this.add.text(timeSliderbg.x, 120, "Tidsskalering", { font: "15px Arial", color: "black", align: "center"}).setOrigin(0.5);

    timeSliderText100x = this.add.text(timeSliderbg.x - 46, timeSliderbg.y - 156, "100x", { font: "15px Arial", color: "black", align: "center"}).setOrigin(0.5);
    timeSliderText10x = this.add.text(timeSliderbg.x - 43, timeSliderbg.y - 79, "10x", { font: "15px Arial", color: "black", align: "center"}).setOrigin(0.5);
    timeSliderText1x = this.add.text(timeSliderbg.x - 40, timeSliderbg.y, "1x", { font: "15px Arial", color: "black", align: "center"}).setOrigin(0.5);
    timeSliderText01x = this.add.text(timeSliderbg.x - 43, timeSliderbg.y + 81, "0.1x", { font: "15px Arial", color: "black", align: "center"}).setOrigin(0.5);
    timeSliderText001x = this.add.text(timeSliderbg.x - 46, timeSliderbg.y + 155, "0.01x", { font: "15px Arial", color: "black", align: "center"}).setOrigin(0.5);

    timeSlider = this.add.image(timeSliderbg.x + 0.5, 300, "sliderbox");
    timeSlider.setScale(0.55);

    //Tegn info-bokse
    powerOutputTitle = this.add.text(centerX - 225, 100, "Energi udsendt ved fission", { font: "35px Arial", color: "black", align: "center"}).setOrigin(0.5);
    powerOutputTextbg = this.add.rectangle(centerX - 225, 150, 300, 50, "black");
    powerOutputTextbg.setStrokeStyle(4, orangeColor);
    powerOutputText = this.add.text(centerX - 225, 150, "### MW", { font: "25px Courier", color: "#00ff00", align: "center"}).setOrigin(0.5);

    neutronCounterTitle = this.add.text(centerX + 225, 100, "Neutrontæller", { font: "35px Arial", color: "black", align: "center"}).setOrigin(0.5);
    neutronCounterTextbg = this.add.rectangle(centerX + 225, 150, 300, 50, "black");
    neutronCounterTextbg.setStrokeStyle(4, orangeColor);
    neutronCounterText = this.add.text(centerX + 225, 150, "### /s", { font: "25px Courier", color: "#00ff00", align: "center"}).setOrigin(0.5);

    //Tegn debug-info
    debugK = this.add.text(10, 250, "Multiplikationsfaktor: ", { font: "25px Courier", color: "white", align: "left"});
    debugSf = this.add.text(10, 275, "Neutronoverskud ved fission: ", { font: "25px Courier", color: "white", align: "left"});
    debugR = this.add.text(10, 300, "Kontrolstangsposition (0 = helt inde) /cm: ", { font: "25px Courier", color: "white", align: "left"});
    debugt = this.add.text(10, 325, "Simuleret tid siden start: ", { font: "25px Courier", color: "white", align: "left"});
    debugK.visible = false;
    debugSf.visible = false;
    debugR.visible = false;
    debugt.visible = false;

    //Første baggrund + velkomst
    bg = this.add.image(0, 0, 'background').setOrigin(0, 0);
    welcomeText = this.add.text(centerX + 3, 100, "- Tryk en vilkårlig tast for at starte -", { font: "40px Arial", color: "black", align: "center"}).setOrigin(0.5);

    //Gør det muligt at trække i skyderne
    controlRodSlider.setInteractive();
    this.input.setDraggable(controlRodSlider);

    timeSlider.setInteractive();
    this.input.setDraggable(timeSlider);

    //Start simultionen når brugeren trykker på skærmen...
    this.input.on('pointerdown', function(pointer){
            if (firstScene) {
                bg.destroy();
                welcomeText.destroy();
                geigerBeepEffect.muted = false;
                firstScene = false;
            }
    });

    //...eller en tast på tastaturet
    this.input.keyboard.on("keydown", function (event) {
        if (firstScene) {
            bg.destroy();
            welcomeText.destroy();
            geigerBeepEffect.muted = false;
            firstScene = false;
        }
        
        //Vis/skjul debug menuen hvis brugeren trykker "D"
        if (event.code == "KeyD"){
            if (showDebug) {
                debugK.visible = false;
                debugSf.visible = false;
                debugR.visible = false;
                debugt.visible = false;
                showDebug = false;
            }
            else {
                debugK.visible = true;
                debugSf.visible = true;
                debugR.visible = true;
                debugt.visible = true;
                showDebug = true;
            }
        }

    });
    

    this.input.on('drag', function (pointer, gameObject, dragX, dragY) {
        //Hvis brugeren trækker i skyderen for kontrolstængerne
        if (gameObject == controlRodSlider) {
            //Flyt skyderen
            controlRodSlider.x = dragX;
            
            //Hold skyderen inden for det tilladte område
            if (controlRodSlider.x > 836) {
                controlRodSlider.x = 836;
            }
            if (controlRodSlider.x < 215){
                controlRodSlider.x = 215;
            }
        }

        //Hvis brugeren trækker i skyderen for tidsskalering
        if (gameObject == timeSlider) {
            let allowedPositions = [144,220,300,381,455];
            
            //Find den tilladte position der ligger tættest på
            let closestAllowedPos = allowedPositions[0];
            let diff = Math.abs(dragY - closestAllowedPos);
            for(let i = 0; i < allowedPositions.length; i++) {
                let tempDiff = Math.abs(dragY - allowedPositions[i]) 
                if (tempDiff < diff) {
                    diff = tempDiff;
                    closestAllowedPos = allowedPositions[i];
                }
            }
            timeSlider.y = closestAllowedPos;
        }
    });    
}

function simulateReactor() {
    R = controlRodPercentage * 500;
    K = 0.998 - 0.01 * Math.sin(R * (Math.PI/500) + (Math.PI/2));
    Sf = (K - 1) * N / L;
    t += dt;
    N += Math.round(Sf * dt);
    power = N * 3.2 * Math.pow(10,-11);
}

//Hastigheden og lydstyrken af geigertæller-lydeffekten afhænger af kontrolstængernes position
function handleGeigerCounter() {
    try {
        geigerBeepEffect.volume = controlRodPercentage / 4;
        geigerBeepEffect.playbackRate = controlRodPercentage;   
    } 
    catch (error) {
        //Gør ingenting
    }
}

//Opdater geigertællerens lydeffekt
let geigerCounterInterval = setInterval(handleGeigerCounter, 10);

let formatter = Intl.NumberFormat("en", { notation: "scientific", maximumSignificantDigits: 4, minimumSignificantDigits: 4 });

function update(time, delta) {
    
    //Delta er tiden siden sidste frame i ms
    //Der omregnes til sekunder
    dt = delta / 1000;

    //Tidsskalering
    switch(timeSlider.y){
        case 144: 
            dt *= 100;
            break;
        case 220:
            dt *= 10;
            break;
        case 381:
            dt *= 0.1;
            break;
        case 455:
            dt *= 0.01;
            break;
        default:
            dt *= 1;
    }

    controlRodPercentage = (controlRodSlider.x - 215) / 621;
    simulateReactor();
    
    //Debug-visning
    debugK.setText("Multiplikationsfaktor: " + K.toFixed(4));
    debugSf.setText("Neutronoverskud ved fission: " + formatter.format(Sf));
    debugR.setText("Kontrolstangsposition (0 = helt inde) /cm: " + R.toFixed(4));

    //Konverter tid til HH-MM-SS format
    var date = new Date(null);
    date.setSeconds(t);
    var result = date.toISOString().substr(11, 8);

    debugt.setText("Simuleret tid siden start: " + result);

    //Opdater info-bokse
    powerOutputText.setText(formatter.format(power) + " W")
    neutronCounterText.setText(formatter.format(N) + " neutroner")    
}
