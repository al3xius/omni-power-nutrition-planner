
const answers = {"first_name":"Alex","gender":"male","age":"25","weight":"65","height":"185","sport":"beginner","traininghours":"2","goal":"?","sport_type":"triathlon","triathlon_distance":"olympic","duration_swim":"24:00","duration_bike":"02:00","duration_run":"01:00","cramps":"yes","sweating":"middle","gi_problems":"some","current_nutrition":"Gels,Elektrolyte","coffein_in_race":"Nur im Rennen","main_goal":"persönliche Bestzeit","race_problems":"Hungerast / Energieeinbruch"}


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

function convertMinutesToHours(duration) {
    let hours = duration / 60;
    return hours;
}

function calculateEnergy(answers) {
    const sportConfig = {
        swim: {
            min: 600,
            max: 800
        },
        bike: {
            min: 700,
            max: 1000
        },
        run: {
            min: 800,
            max: 1100
        }
    }

    const results = {};

    for (const [key, value] of Object.entries(sportConfig)) {
        // check if duration for sport is in answer
        const duration = answers[`duration_${key}`];
        if (!duration) continue;
        const durationInMinutes = convertDurationToMinutes(duration);
        if (!durationInMinutes) continue;

        const config = sportConfig[key];

        let energyRate = (config.min + config.max) / 2;


        energyRate = Math.max(energyRate, config.min);
        energyRate = Math.min(energyRate, config.max);
        results[key] = { 
            rate: energyRate,
            duration: durationInMinutes,
            value: energyRate * durationInMinutes/60
        };
    }

    return results;
}

console.log("Start")
console.log(calculateEnergy(answers))