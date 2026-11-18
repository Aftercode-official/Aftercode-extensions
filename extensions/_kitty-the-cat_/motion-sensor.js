// Name: Motion Sensor
// ID: motionsensor
// Description: Motion Sensor Extension for Scratch
// By: _Kitty-the-cat_ <https://scratch.mit.edu/users/_kitty-the-cat_/>
// License: MIT
(function (Scratch) {
  "use strict";

  if (!Scratch.extensions.unsandboxed) {
    throw new Error("Motion Sensor requires Unsandboxed mode!");
  }

  class MotionSensor {
    constructor() {
      this.sensorEnabled = false;
      this.sensorStatus = "Sensor is off";

      this.alpha = 0;
      this.beta = 0;
      this.gamma = 0;

      this.accelX = 0;
      this.accelY = 0;
      this.accelZ = 0;

      this.rotateAlpha = 0;
      this.rotateBeta = 0;
      this.rotateGamma = 0;

      this.hasOrientation = false;
      this.hasMotion = false;

      this.baselineX = 0;
      this.baselineY = 0;
      this.calibrated = false;

      this.lastAccel = null;
      this.lastShakeAt = 0;
      this.shakeStrength = 0;

      this.handleOrientation =
        this.handleOrientation.bind(this);

      this.handleMotion =
        this.handleMotion.bind(this);
    }

    getInfo() {
      return {
        id: "motionsensor",
        name: "Motion Sensor",

        color1: "#2679D8",
        color2: "#1859A8",
        color3: "#10417D",

        blocks: [
          {
            opcode: "enableSensors",
            blockType: Scratch.BlockType.COMMAND,
            text: "enable phone sensors"
          },
          {
            opcode: "stopSensors",
            blockType: Scratch.BlockType.COMMAND,
            text: "stop phone sensors"
          },
          {
            opcode: "calibrate",
            blockType: Scratch.BlockType.COMMAND,
            text: "calibrate current position"
          },

          "---",

          {
            opcode: "enabledReporter",
            blockType: Scratch.BlockType.BOOLEAN,
            text: "sensor enabled?"
          },
          {
            opcode: "dataReceived",
            blockType: Scratch.BlockType.BOOLEAN,
            text: "sensor data received?"
          },
          {
            opcode: "statusReporter",
            blockType: Scratch.BlockType.REPORTER,
            text: "sensor status"
          },

          "---",

          {
            opcode: "tiltX",
            blockType: Scratch.BlockType.REPORTER,
            text: "left-right tilt (degrees)"
          },
          {
            opcode: "tiltY",
            blockType: Scratch.BlockType.REPORTER,
            text: "forward-backward tilt (degrees)"
          },
          {
            opcode: "heading",
            blockType: Scratch.BlockType.REPORTER,
            text: "alpha angle (degrees)"
          },

          "---",

          {
            opcode: "acceleration",
            blockType: Scratch.BlockType.REPORTER,
            text: "acceleration [AXIS]",
            arguments: {
              AXIS: {
                type: Scratch.ArgumentType.STRING,
                menu: "axes"
              }
            }
          },
          {
            opcode: "rotation",
            blockType: Scratch.BlockType.REPORTER,
            text: "rotation rate [AXIS]",
            arguments: {
              AXIS: {
                type: Scratch.ArgumentType.STRING,
                menu: "rotationAxes"
              }
            }
          },

          "---",

          {
            opcode: "shaking",
            blockType: Scratch.BlockType.BOOLEAN,
            text: "phone shaking?"
          },
          {
            opcode: "shakeStrengthReporter",
            blockType: Scratch.BlockType.REPORTER,
            text: "shake strength"
          }
        ],

        menus: {
          axes: {
            acceptReporters: true,
            items: [
              { text: "X", value: "x" },
              { text: "Y", value: "y" },
              { text: "Z", value: "z" }
            ]
          },

          rotationAxes: {
            acceptReporters: true,
            items: [
              { text: "Alpha", value: "alpha" },
              { text: "Beta", value: "beta" },
              { text: "Gamma", value: "gamma" }
            ]
          }
        }
      };
    }

    enableSensors() {
      if (this.sensorEnabled) return;

      if (!window.isSecureContext) {
        this.sensorStatus = "HTTPS or localhost required";
        return;
      }

      if (
        typeof window.DeviceOrientationEvent !== "function" ||
        typeof window.DeviceMotionEvent !== "function"
      ) {
        this.sensorStatus = "Sensors not supported";
        return;
      }

      try {
        window.addEventListener(
          "deviceorientation",
          this.handleOrientation
        );

        window.addEventListener(
          "devicemotion",
          this.handleMotion
        );

        this.sensorEnabled = true;
        this.hasOrientation = false;
        this.hasMotion = false;

        this.lastAccel = null;
        this.lastShakeAt = 0;
        this.shakeStrength = 0;

        this.sensorStatus = "Waiting for sensor data";
      } catch (error) {
        this.sensorEnabled = false;
        this.sensorStatus = "Error: " + error.message;
      }
    }

    stopSensors() {
      window.removeEventListener(
        "deviceorientation",
        this.handleOrientation
      );

      window.removeEventListener(
        "devicemotion",
        this.handleMotion
      );

      this.sensorEnabled = false;
      this.hasOrientation = false;
      this.hasMotion = false;

      this.lastAccel = null;
      this.shakeStrength = 0;
      this.sensorStatus = "Sensors stopped";
    }

    handleOrientation(event) {
      if (!this.sensorEnabled) return;

      const alpha = event.alpha;
      const beta = event.beta;
      const gamma = event.gamma;

      if (
        typeof alpha === "number" &&
        typeof beta === "number" &&
        typeof gamma === "number"
      ) {
        this.alpha = alpha;
        this.beta = beta;
        this.gamma = gamma;

        this.hasOrientation = true;
        this.updateStatus();
      }
    }

    handleMotion(event) {
      if (!this.sensorEnabled) return;

      const acceleration =
        event.accelerationIncludingGravity ||
        event.acceleration;

      if (acceleration) {
        const x = acceleration.x;
        const y = acceleration.y;
        const z = acceleration.z;

        if (
          typeof x === "number" &&
          typeof y === "number" &&
          typeof z === "number"
        ) {
          this.accelX = x;
          this.accelY = y;
          this.accelZ = z;

          this.hasMotion = true;

          this.detectShake(x, y, z);
          this.updateStatus();
        }
      }

      const rotation = event.rotationRate;

      if (rotation) {
        this.rotateAlpha =
          typeof rotation.alpha === "number"
            ? rotation.alpha : 0;

        this.rotateBeta =
          typeof rotation.beta === "number"
            ? rotation.beta : 0;

        this.rotateGamma =
          typeof rotation.gamma === "number"
            ? rotation.gamma : 0;
      }
    }

    detectShake(x, y, z) {
      if (this.lastAccel !== null) {
        const dx = x - this.lastAccel.x;
        const dy = y - this.lastAccel.y;
        const dz = z - this.lastAccel.z;

        const strength = Math.sqrt(
          dx * dx + dy * dy + dz * dz
        );

        this.shakeStrength = strength;

        if (strength > 3.5) {
          this.lastShakeAt = Date.now();
        }
      }

      this.lastAccel = { x, y, z };
    }

    updateStatus() {
      if (this.hasOrientation && this.hasMotion) {
        this.sensorStatus = "All sensor data received";
      } else if (this.hasOrientation) {
        this.sensorStatus = "Orientation data received";
      } else if (this.hasMotion) {
        this.sensorStatus = "Motion data received";
      }
    }

    calibrate() {
      if (!this.hasOrientation) return;

      this.baselineX = this.gamma;
      this.baselineY = this.beta;
      this.calibrated = true;
    }

    enabledReporter() {
      return this.sensorEnabled;
    }

    dataReceived() {
      return this.hasOrientation || this.hasMotion;
    }

    statusReporter() {
      return this.sensorStatus;
    }

    tiltX() {
      if (!this.hasOrientation) return 0;

      return this.calibrated
        ? this.gamma - this.baselineX
        : this.gamma;
    }

    tiltY() {
      if (!this.hasOrientation) return 0;

      return this.calibrated
        ? this.beta - this.baselineY
        : this.beta;
    }

    heading() {
      return this.hasOrientation ? this.alpha : 0;
    }

    acceleration(args) {
      const axis = String(args.AXIS).toLowerCase();

      if (!this.hasMotion) return 0;

      switch (axis) {
        case "x": return this.accelX;
        case "y": return this.accelY;
        case "z": return this.accelZ;
        default: return 0;
      }
    }

    rotation(args) {
      const axis = String(args.AXIS).toLowerCase();

      if (!this.hasMotion) return 0;

      switch (axis) {
        case "alpha": return this.rotateAlpha;
        case "beta": return this.rotateBeta;
        case "gamma": return this.rotateGamma;
        default: return 0;
      }
    }

    shaking() {
      return (
        this.sensorEnabled &&
        Date.now() - this.lastShakeAt < 500 &&
        this.lastShakeAt !== 0
      );
    }

    shakeStrengthReporter() {
      return this.sensorEnabled
        ? this.shakeStrength
        : 0;
    }
  }

  Scratch.extensions.register(new MotionSensor());

})(Scratch);
