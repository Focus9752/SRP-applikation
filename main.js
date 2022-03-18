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

let geigerBeepEffect;

let centerX;
let centerY;
let sliderMiddle;

let controlRodPercentage = 0;
let deltaTime;
let K, Sf, t = 0, N = 0, dt = 0, L = 0.1, Sk = 10, R = 0;
let interval = 0.0001;
let deltaN;
let energi;
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
    // coreTempTextbg = this.add.rectangle(centerX - 350, 150, coreTempTitle.width, 50, "black");
    // coreTempTextbg.setStrokeStyle(4, orangeColor);
    // coreTempText = this.add.text(centerX - 350, 150, "### \u00B0C", { font: "25px Courier", color: "#00ff00", align: "center"}).setOrigin(0.5);
    
    debugK = this.add.text(10, 250, "Multiplikationsfaktor: ", { font: "25px Courier", color: "white", align: "left"});
    debugSf = this.add.text(10, 270, "Neutroner skabt ved fission /s: ", { font: "25px Courier", color: "white", align: "left"});
    debugSk = this.add.text(10, 290, "Ekstern neutrontilførsel: ", { font: "25px Courier", color: "white", align: "left"});
    debugR = this.add.text(10, 310, "Kontrolstangsposition (0 = helt inde) /cm: ", { font: "25px Courier", color: "white", align: "left"});


    powerOutputTitle = this.add.text(centerX, 100, "Energi", { font: "35px Arial", color: "black", align: "center"}).setOrigin(0.5);
    powerOutputTextbg = this.add.rectangle(centerX, 150, powerOutputTitle.width, 50, "black");
    powerOutputTextbg.setStrokeStyle(4, orangeColor);
    powerOutputText = this.add.text(centerX, 150, "### MW", { font: "25px Courier", color: "#00ff00", align: "center"}).setOrigin(0.5);

    neutronCounterTitle = this.add.text(centerX + 350, 100, "Neutrontæller", { font: "35px Arial", color: "black", align: "center"}).setOrigin(0.5);
    neutronCounterTextbg = this.add.rectangle(centerX + 350, 150, neutronCounterTitle.width, 50, "black");
    neutronCounterTextbg.setStrokeStyle(4, orangeColor);
    neutronCounterText = this.add.text(centerX + 350, 150, "### /s", { font: "25px Courier", color: "#00ff00", align: "center"}).setOrigin(0.5);

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

    geigerBeepEffect = this.sound.add("geigerbeep");
    geigerBeepEffect.loop = true;
    geigerBeepEffect.play();
}

function roundToDecimalPlaces(num, decimalPlaces) {
    return Number(Math.round(num + "e" + decimalPlaces) + "e-" + decimalPlaces);
}

function simulateReactor() {
    R = controlRodPercentage * 75;
    K = 0.9995 - 0.008 * Math.sin(R * (Math.PI/75) + (Math.PI/2));
    Sf = (K - 1) * N / L;
    t += interval;
    deltaN = Sk * interval + Sf * interval;
    energi = Math.abs(N * 200);
    energi = energi.toFixed(10)
    effekt = energi / interval;
    N += deltaN;

    powerOutputText.setText(Math.round(energi) + " MeV/s");
    neutronCounterText.setText(Math.round(N) + " neutroner");

    debugK.setText("Multiplikationsfaktor: " + K.toFixed(3));
    debugSf.setText("Neutroner skabt ved fission /s: " + Sf.toFixed(2));
    debugSk.setText("Ekstern neutrontilførsel: " + Sk.toFixed(2));
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


function update(time, delta) {
    

    if (game.sound.context.state === 'suspended') {
        this.sound.context.resume();
    }

    if (K > 1) {
        this.sound.setMute(false);
    }
    else {
        this.sound.setMute(true);
    }

    dt = delta / 1000;
    interval = dt;
    //coreTempTextbg.displayWidth = coreTempText.width + 10;
    powerOutputTextbg.displayWidth = powerOutputText.width + 10;
    neutronCounterTextbg.displayWidth = neutronCounterText.width + 10;
    
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
