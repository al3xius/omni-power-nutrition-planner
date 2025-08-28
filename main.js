// Embed with
{
  /* <script src="https://cdn.jsdelivr.net/gh/al3xius/omni-power-nutrition-planner@main/main.js"></script> */
}

// Config
const energyFactors = {
  "sport_level:beginner": -2,
  "sport_level:intermediate": 0,
  "sport_level:advanced": 2,
  "weight:influence": 0.1,
};

const referenceWeight = 75;

// Input Config
const validationConfig = {
  Alter: {
    type: "number",
    min: 0,
    max: 150,
  },
  "Gewicht in kg": {
    type: "number",
    min: 30,
    max: 300,
  },
  "Größe in cm": {
    type: "number",
    min: 100,
    max: 250,
  },
  "Dauer Rad": {
    type: "duration"
  },
  "Dauer Schwimmen": {
    type: "duration"
  },
  "Dauer Laufen": {
    type: "duration"
  }
};

// Helpers
async function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

function waitForElement(id) {
  return new Promise((resolve) => {
    if (
      document
        .getElementById("perfect-product-finder")
        .shadowRoot.getElementById(id)
    ) {
      return resolve(
        document
          .getElementById("perfect-product-finder")
          .shadowRoot.getElementById(id)
      );
    }

    // loop until element is found
    const interval = setInterval(() => {
      const element = document
        .getElementById("perfect-product-finder")
        .shadowRoot.getElementById(id);
      if (element) {
        clearInterval(interval);
        resolve(element);
      }
    }, 100);
  });
}

// Input Validators
function validateInput(input, config) {
  if (!input) return false;

  const { type } = config;

  if (type === "number") {
    const { min, max } = config;
    const value = Number(input);
    if (isNaN(value)) return "Bitte nur Zahlen eingeben!";
    if (min !== undefined && value < min)
      return `Bitte mindestens ${min} eingeben!`;
    if (max !== undefined && value > max)
      return `Bitte höchstens ${max} eingeben!`;
  }
  if (type === "duration") {
    const value = convertDurationToMinutes(input);
    if (!value) return "Bitte eine gültige Dauer eingeben! Format: hh:mm";
  }

  return false;
}

function convertDurationToMinutes(duration) {
  if (typeof duration !== "string") return 0;
  const parts = duration.split(":").map(Number);

  if (parts.length === 1 && !isNaN(parts[0])) {
    // Single number, treat as minutes
    return parts[0];
  } else if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    // HH:MM format
    if (parts[0] < 0 || parts[1] < 0 || parts[1] >= 60) return 0;
    return parts[0] * 60 + parts[1];
  }
  // Invalid input
  return 0;
}

function convertStringToNumber(str) {
  if (typeof str !== "string") return 0;
  const num = Number(str);
  return isNaN(num) ? 0 : num;
}

function convertMinutesToHours(duration) {
  let hours = duration / 60;
  return hours;
}

// Logic
function aggregateAnswers(answers, factors) {
  let score = 0;
  for (const [key, value] of Object.entries(answers)) {
    const factorKey = `${key}:${value}`;
    if (factors[factorKey]) {
      score += factors[factorKey];
    }
  }

  const weight = convertStringToNumber(answers.weight);
  if (weight) {
    let weightFactor = referenceWeight / weight;
    weightFactor = (1 - weightFactor) * 100 * factors["weight:influence"];
    score += weightFactor;
  }

  return score;
}

function calculateEnergy(answers) {
  const sportConfig = {
    swim: {
      min: 600,
      max: 800,
    },
    bike: {
      min: 700,
      max: 1000,
    },
    run: {
      min: 800,
      max: 1100,
    },
  };

  const results = {};

  let factor = aggregateAnswers(answers, energyFactors);

  for (const [key, value] of Object.entries(sportConfig)) {
    // check if duration for sport is in answer
    const duration = answers[`duration_${key}`];
    if (!duration) continue;
    const durationInMinutes = convertDurationToMinutes(duration);
    if (!durationInMinutes) continue;

    const config = sportConfig[key];

    let energyRate = (config.min + config.max) / 2;
    energyRate = (energyRate * (100 + factor)) / 100;

    energyRate = Math.max(energyRate, config.min);
    energyRate = Math.min(energyRate, config.max);
    results[key] = {
      rate: energyRate,
      duration: durationInMinutes,
      value: (energyRate * durationInMinutes) / 60,
      factor: factor,
    };
  }

  return results;
}

async function main() {
  if (typeof window === "undefined") {
    const answers = {
      first_name: "Alex",
      gender: "male",
      age: "25",
      weight: "200",
      height: "185",
      sport_level: "beginner",
      traininghours: "2",
      goal: "?",
      sport_type: "triathlon",
      triathlon_distance: "olympic",
      duration_swim: "24:00",
      duration_bike: "02:00",
      duration_run: "01:00",
      cramps: "yes",
      sweating: "middle",
      gi_problems: "some",
      current_nutrition: "Gels,Elektrolyte",
      coffein_in_race: "Nur im Rennen",
      main_goal: "persönliche Bestzeit",
      race_problems: "Hungerast / Energieeinbruch",
    };
    console.log("Running in Debug Mode!");
    console.log(calculateEnergy(answers));
  } else {
    console.log("Registering event listeners");
    window.addEventListener("lantern:display_results", (e) => {
      const {
        results,
        content_block_results,
        answers,
        email,
        first_name,
        marketing_consent,
      } = e.detail;

      console.log("Start");
      const energy_result = calculateEnergy(answers);
      console.log(energy_result);

      document
        .getElementById("perfect-product-finder")
        .shadowRoot.getElementById("answers").innerText = `${JSON.stringify(
        energy_result
      )}`;
    });

    window.addEventListener("lantern:display_question", async (e) => {
      const { id, title, description, type, options, isRequired } = e.detail;
      console.log(e);
      console.log({ id, title, description, type, options, isRequired });

      // register event listener
      if (type === "INPUT_ONE_LINE_TEXT") {
        const input = await waitForElement(`customInput`);
        if (!input) return;

        input.addEventListener("input", (e) => {
          const validation = validationConfig[title]
            ? validateInput(e.target.value, validationConfig[title])
            : false;

          // Update validation message
          let valElement = document
          .getElementById("perfect-product-finder")
          .shadowRoot.getElementById("validationMessage");
          if (!valElement) {
              // Create
              valElement = document.createElement("div");
              valElement.id = "validationMessage";
              valElement.style.color = "red";
              input.parentNode.insertBefore(valElement, input.nextSibling);
          }
  
          valElement.innerText = validation ? validation : "";
        });
      }
    });
  }
}

main();
