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

let sliderBox;
let sliderTextLeft;
let sliderTextRight;
let sliderTitle;

let geigerBeepEffect = document.getElementById("geigerAudioElem");

let centerX;
let centerY;
let sliderMiddle;

let controlRodPercentage = 0;
let deltaTime;
let K, Sf, t = 0, N = 3.2 * Math.pow(10,19), dt = 0, L = 0.1, R = 0;
let interval = 0.0001;
let deltaN;
let energy;
let effekt;

let firstDrag = true;

let SPACE_key;

let sceneNum = 0;

function preload () {
    this.load.image('background', 'assets/img/reactorcitybg.jpg');
    this.load.image("dimmed_background", "assets/img/reactorcitybgdimmed.jpg");
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

    //Tegn skyder
    this.add.image(centerX, 525, "sliderbg");
    sliderMiddle = centerX + 2;
    sliderBox = this.add.image(sliderMiddle, 525, "sliderbox");
    sliderTextLeft = this.add.text(165, 510, "ind", { font: "25px Arial", color: "black", align: "center"});
    sliderTextRight = this.add.text(852, 509, "ud", { font: "25px Arial", color: "black", align: "center"});
    sliderTitle = this.add.text(centerX, 450, "Kontrolstænger", { font: "35px Arial", color: "black", align: "center"}).setOrigin(0.5);

    //Tegn de tre info-bokse
    // coreTempTitle = this.add.text(centerX - 350, 100, "Temperatur", { font: "35px Arial", color: "black", align: "center"}).setOrigin(0.5);
    // coreTempTextbg = this.add.rectangle(centerX - 350, 150, 300, 50, "black");
    // coreTempTextbg.setStrokeStyle(4, orangeColor);
    // coreTempText = this.add.text(centerX - 350, 150, "### \u00B0C", { font: "25px Courier", color: "#00ff00", align: "center"}).setOrigin(0.5);
    
    


    powerOutputTitle = this.add.text(centerX, 100, "Effekt ved fission", { font: "35px Arial", color: "black", align: "center"}).setOrigin(0.5);
    powerOutputTextbg = this.add.rectangle(centerX, 150, 300, 50, "black");
    powerOutputTextbg.setStrokeStyle(4, orangeColor);
    powerOutputText = this.add.text(centerX, 150, "### MW", { font: "25px Courier", color: "#00ff00", align: "center"}).setOrigin(0.5);

    neutronCounterTitle = this.add.text(centerX + 350, 100, "Neutrontæller", { font: "35px Arial", color: "black", align: "center"}).setOrigin(0.5);
    neutronCounterTextbg = this.add.rectangle(centerX + 350, 150, 300, 50, "black");
    neutronCounterTextbg.setStrokeStyle(4, orangeColor);
    neutronCounterText = this.add.text(centerX + 350, 150, "### /s", { font: "25px Courier", color: "#00ff00", align: "center"}).setOrigin(0.5);

    debugK = this.add.text(10, 250, "Multiplikationsfaktor: ", { font: "25px Courier", color: "white", align: "left"});
    debugSf = this.add.text(10, 270, "Neutroner skabt ved fission /s: ", { font: "25px Courier", color: "white", align: "left"});
    debugSk = this.add.text(10, 290, "Ekstern neutrontilførsel: ", { font: "25px Courier", color: "white", align: "left"});
    debugR = this.add.text(10, 310, "Kontrolstangsposition (0 = helt inde) /cm: ", { font: "25px Courier", color: "white", align: "left"});

    //Første baggrund + velkomst
    bg = this.add.image(0, 0, 'background').setOrigin(0, 0);
    welcomeText = this.add.text(centerX + 3, 100, "- Tryk en vilkårlig tast for at starte -", { font: "40px Arial", color: "black", align: "center"}).setOrigin(0.5);

    //Indlæs mellemrumstasten
    SPACE_key = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    //Gør det muligt at trække i skyderen
    sliderBox.setInteractive();
    this.input.setDraggable(sliderBox);

    this.input.on('pointerdown', function(pointer){
            if (sceneNum === 0) {
                bg.destroy();
                welcomeText.destroy();

                sceneNum++;
            }
    });
    

    this.input.on('drag', function (pointer, gameObject, dragX, dragY) {
        //Hvis brugeren trækker i skyderen
        if (gameObject == sliderBox) {
            //Flyt skyderen
            sliderBox.x = dragX;
            
            //Hold skyderen inden for det tilladte område
            if (sliderBox.x > 836) {
                sliderBox.x = 836;
            }
            if (sliderBox.x < 215){
                sliderBox.x = 215;
            }

            if (firstDrag){
                
            }
        }
    });    
}

function roundToDecimalPlaces(num, decimalPlaces) {
    return Number(Math.round(num + "e" + decimalPlaces) + "e-" + decimalPlaces);
}


function displayWithSiUnit(num, unit) {
    prefixes = {
        //Bruger strenge i stedet for tal fordi JS ikke understøtter negative nøgler til objekter
        "-24": "y",
        "-21": "z",
        "-18": "a",
        "-15": "f",
        "-12": "p",
        "-9": "n",
        //Mikro er det eneste præfiks med et græsk bogstav O.O
        "-6": "\u03BC",
        "-3": "m",
        "0": " ",
        "3": "k",
        "6": "M",
        "9": "G",
        "12": "T",
        "15": "P",
        "18": "E",
        "21": "Z",
        "24": "Y"
    }

    //Tager første ciffer i log10 af tallet for at få 10-tals eksponenten
    let log10Num = Math.log10(num);
    let exponent;
    //Regn minus med hvis tallet er negativt
    if (log10Num < 0) {
        exponent = log10Num.toString()[0] + log10Num.toString()[1]
    }
    else {
        exponent = log10Num.toString()[0];
    }

    //Træk tal fra indtil vi finder den rette tierpotens der kan deles med tre (10^3, 10^6, osv.)
    while (exponent % 3 != 0) {
        exponent
    }

}

function simulateReactor() {
    R = controlRodPercentage * 75;
    K = 0.9995 - 0.008 * Math.sin(R * (Math.PI/75) + (Math.PI/2));
    Sf = (K - 1) * N / L;
    t += interval;
    deltaN = Sf * interval;
    N += deltaN;
    effekt = N * 3.2 * Math.pow(10,-11);

    powerOutputText.setText(Intl.NumberFormat("en", { notation: "scientific", maximumSignificantDigits: 3, minimumSignificantDigits: 3 }).format(Math.round(effekt)) + " W");
    neutronCounterText.setText(Intl.NumberFormat("en", { notation: "scientific", maximumSignificantDigits: 3, minimumSignificantDigits: 3 }).format(Math.round(N)) + " neutroner");

    debugK.setText("Multiplikationsfaktor: " + K.toFixed(3));
    debugSf.setText("Neutroner skabt ved fission /s: " + Sf.toFixed(2));
    debugR.setText("Kontrolstangsposition (0 = helt inde) /cm: " + R.toFixed(2));

    // console.log("------")
    // console.log("Time: " + t + "s")
    // console.log("K:" + K);
    // console.log("Sf: " + Sf);
    // console.log("Sk: " + Sk);
    // console.log("N: " + N);
    // console.log("DeltaN: " + deltaN);
    //simulateReactor();
}

function handleGeigerCounter() {
    geigerBeepEffect.muted = false;
    geigerBeepEffect.volume = 1;
    if(N > 10000){
        geigerBeepEffect.playbackRate = 4;
    }
    else {
        geigerBeepEffect.playbackRate = 4*Math.sin(0.0001445613057*N + 0.1251832699);
    }  
}

let geigerCounterInterval = setInterval(handleGeigerCounter, 10);

let formatter = Intl.NumberFormat("en", { notation: "scientific", maximumSignificantDigits: 4, minimumSignificantDigits: 4 });

function update(time, delta) {
    

    if (game.sound.context.state === 'suspended') {
        this.sound.context.resume();
    }

    

    dt = delta / 1000;
    interval = dt;
    
    
    controlRodPercentage = (sliderBox.x - 215) / 621;

    

    simulateReactor();

    //Når en tast trykkes
    this.input.keyboard.on("keydown", function (event) {
        
            if (sceneNum === 0) {
                bg.destroy();
                welcomeText.destroy();

                sceneNum++;
            }
        
        console.log(event.code);
    });
}
