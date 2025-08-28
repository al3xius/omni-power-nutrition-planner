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

// Config
const energyFactors = {
  "sport_level:beginner": -2,
  "sport_level:intermediate": 0,
  "sport_level:advanced": 2,
  "weight:influence": 0.1,
};

const referenceWeight = 75;

// Helpers
const delay = ms => new Promise(res => setTimeout(res, ms));

function convertDurationToMinutes(duration) {
  if (typeof duration !== "string") return 0;
  const parts = duration.split(":").map(Number);

  if (parts.length === 1 && !isNaN(parts[0])) {
    // Single number, treat as minutes
    return parts[0];
  } else if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    // HH:MM format
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
    await delay(1000);
    if (typeof window === undefined) {
      console.log("Registering event listener");
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
    } else {
      console.log("Running in Debug Mode!");
      console.log(calculateEnergy(answers));
    }
}

main();