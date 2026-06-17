const DEFAULT_ROWS = 5;

const calTable =
document.querySelector(
"#cal-table tbody"
);

const resTable =
document.querySelector(
"#res-table tbody"
);

const targetInput =
document.getElementById(
"target"
);

const workInput =
document.getElementById(
"work"
);

const halfInput =
document.getElementById(
"half"
);

const statusLabel =
document.getElementById(
"status"
);

const requiredLabel =
document.getElementById(
"required"
);

const calAvgLabel =
document.getElementById(
"cal-avg"
);

const resAvgLabel =
document.getElementById(
"res-avg"
);

const actualLabel =
document.getElementById(
"actual"
);

const diffLabel =
document.getElementById(
"difference"
);

const reachLabel =
document.getElementById(
"reach"
);

const countdownLabel =
document.getElementById(
"countdown"
);

function formatMbq(value){


return value.toFixed(2)
    + " MBq";


}

function formatDiff(value){


if(value >= 0){

    return "+"
        + value.toFixed(2)
        + " MBq";
}

return value.toFixed(2)
    + " MBq";


}

function parseTimeToMinutes(text){


text = text
    .trim()
    .replace(":","");

if(text.length === 3){

    text = "0" + text;
}

if(text.length !== 4){

    throw new Error(
        "時刻は3桁または4桁で入力してください"
    );
}

const hh =
    parseInt(
        text.substring(0,2)
    );

const mm =
    parseInt(
        text.substring(2,4)
    );

if(hh < 0 || hh > 23){

    throw new Error(
        "時が不正です"
    );
}

if(mm < 0 || mm > 59){

    throw new Error(
        "分が不正です"
    );
}

return hh * 60 + mm;


}

function normalizeTime(text){


text = text
    .trim()
    .replace(":","");

if(text.length === 3){

    text = "0" + text;
}

if(text.length !== 4){

    return text;
}

const hh =
    parseInt(
        text.substring(0,2)
    );

const mm =
    parseInt(
        text.substring(2,4)
    );

if(isNaN(hh) ||
   isNaN(mm)){

    return text;
}

if(hh < 0 ||
   hh > 23){

    return text;
}

if(mm < 0 ||
   mm > 59){

    return text;
}

return (
    hh.toString()
        .padStart(2,"0")
    +
    ":"
    +
    mm.toString()
        .padStart(2,"0")
);


}

function minutesToHms(
totalMinutes
){


const totalSeconds =
    Math.round(
        totalMinutes * 60
    );

const h =
    Math.floor(
        totalSeconds / 3600
    ) % 24;

const m =
    Math.floor(
        (
            totalSeconds % 3600
        ) / 60
    );

const s =
    totalSeconds % 60;

return (
    h.toString()
        .padStart(2,"0")
    +
    ":"
    +
    m.toString()
        .padStart(2,"0")
    +
    ":"
    +
    s.toString()
        .padStart(2,"0")
);


}

function decayCorrectToBase(
measuredMbq,
measuredTime,
baseTime,
halfLife
){


const dt =
    measuredTime
    - baseTime;

return (
    measuredMbq *
    Math.pow(
        2,
        dt / halfLife
    )
);


}

function calcRequiredDose(
targetMbq,
workMinutes,
halfLife
){


return (
    targetMbq *
    Math.pow(
        2,
        workMinutes
        /
        halfLife
    )
);


}

function calcReachMinutes(
actualDose,
targetDose,
halfLife
){


return (
    halfLife *
    Math.log2(
        actualDose
        /
        targetDose
    )
);


}

function correctedAverage(
rows,
baseTime,
halfLife
){


if(rows.length === 0){

    return 0;
}

let sum = 0;

rows.forEach(row=>{

    sum +=
        decayCorrectToBase(
            row.dose,
            row.time,
            baseTime,
            halfLife
        );

});

return (
    sum /
    rows.length
);


}
function createRow(table){


const tr =
    document.createElement(
        "tr"
    );

const tdTime =
    document.createElement(
        "td"
    );

const tdDose =
    document.createElement(
        "td"
    );

const timeInput =
    document.createElement(
        "input"
    );

const doseInput =
    document.createElement(
        "input"
    );

timeInput.type = "text";

timeInput.placeholder =
    "HHMM";

doseInput.type =
    "number";

doseInput.step =
    "0.1";

timeInput.addEventListener(
    "change",
    ()=>{

        timeInput.value =
            normalizeTime(
                timeInput.value
            );

        saveState();

        calculate();

    }
);

doseInput.addEventListener(
    "input",
    ()=>{

        saveState();

        calculate();

    }
);

tdTime.appendChild(
    timeInput
);

tdDose.appendChild(
    doseInput
);

tr.appendChild(
    tdTime
);

tr.appendChild(
    tdDose
);

table.appendChild(
    tr
);


}

function initializeTables(){


calTable.innerHTML = "";

resTable.innerHTML = "";

for(
    let i = 0;
    i < DEFAULT_ROWS;
    i++
){

    createRow(
        calTable
    );
}

for(
    let i = 0;
    i < DEFAULT_ROWS;
    i++
){

    createRow(
        resTable
    );
}


}

function getRows(table){


const rows = [];

table
.querySelectorAll("tr")
.forEach(
    (
        tr,
        index
    )=>{

    const inputs =
        tr.querySelectorAll(
            "input"
        );

    const time =
        inputs[0]
        .value
        .trim();

    const dose =
        inputs[1]
        .value
        .trim();

    if(
        time === ""
        &&
        dose === ""
    ){

        return;
    }

    if(
        time === ""
    ){

        throw new Error(
            (index + 1)
            +
            "行目の時刻が未入力です"
        );
    }

    if(
        dose === ""
    ){

        throw new Error(
            (index + 1)
            +
            "行目のMBqが未入力です"
        );
    }

    rows.push({

        time:
            parseTimeToMinutes(
                time
            ),

        dose:
            parseFloat(
                dose
            )

    });

});

return rows;


}

function validateTimeOrder(
rows,
title
){


let last = null;

rows.forEach(
    (
        row,
        index
    )=>{

    if(
        last !== null
        &&
        row.time < last
    ){

        throw new Error(

            title
            +
            "\n"
            +
            (index + 1)
            +
            "行目\n時刻順が不正です"

        );
    }

    last =
        row.time;

});


}

function serializeTable(
table
){


const rows = [];

table
.querySelectorAll(
    "tr"
)
.forEach(tr=>{

    const inputs =
        tr.querySelectorAll(
            "input"
        );

    rows.push({

        time:
            inputs[0].value,

        dose:
            inputs[1].value

    });

});

return rows;


}

function saveState(){


const state = {

    target:
        targetInput.value,

    work:
        workInput.value,

    half:
        halfInput.value,

    cal:
        serializeTable(
            calTable
        ),

    res:
        serializeTable(
            resTable
        )

};

localStorage.setItem(
    "amy-state",
    JSON.stringify(
        state
    )
);


}

function restoreState(){


const json =
    localStorage.getItem(
        "amy-state"
    );

if(!json){

    return;
}

const state =
    JSON.parse(
        json
    );

targetInput.value =
    state.target;

workInput.value =
    state.work;

halfInput.value =
    state.half;

if(
    state.cal
){

    const rows =
        calTable
        .querySelectorAll(
            "tr"
        );

    rows.forEach(
        (
            tr,
            index
        )=>{

        if(
            !state.cal[index]
        ){
            return;
        }

        const inputs =
            tr.querySelectorAll(
                "input"
            );

        inputs[0].value =
            state.cal[index]
            .time;

        inputs[1].value =
            state.cal[index]
            .dose;

    });

}

if(
    state.res
){

    const rows =
        resTable
        .querySelectorAll(
            "tr"
        );

    rows.forEach(
        (
            tr,
            index
        )=>{

        if(
            !state.res[index]
        ){
            return;
        }

        const inputs =
            tr.querySelectorAll(
                "input"
            );

        inputs[0].value =
            state.res[index]
            .time;

        inputs[1].value =
            state.res[index]
            .dose;

    });

}


}
function calculate(){


try{

    const target =
        parseFloat(
            targetInput.value
        );

    const work =
        parseFloat(
            workInput.value
        );

    const half =
        parseFloat(
            halfInput.value
        );

    if(
        isNaN(target)
        ||
        isNaN(work)
        ||
        isNaN(half)
    ){
        return;
    }

    if(
        target <= 0
        ||
        half <= 0
    ){
        return;
    }

    const required =
        calcRequiredDose(
            target,
            work,
            half
        );

    requiredLabel.textContent =
        formatMbq(
            required
        );

    const calRows =
        getRows(
            calTable
        );

    const resRows =
        getRows(
            resTable
        );

    if(
        calRows.length === 0
    ){
        return;
    }

    validateTimeOrder(
        calRows,
        "検定放射能計"
    );

    validateTimeOrder(
        resRows,
        "残量計"
    );

    const baseTime =
        calRows[0].time;

    const calAvg =
        correctedAverage(
            calRows,
            baseTime,
            half
        );

    const resAvg =
        correctedAverage(
            resRows,
            baseTime,
            half
        );

    const actual =
        calAvg - resAvg;

    if(
        actual <= 0
    ){

        statusLabel.textContent =
            "残量平均が検定平均を超えています";

        statusLabel.style.color =
            "red";

        return;
    }

    const difference =
        actual - required;

    calAvgLabel.textContent =
        formatMbq(
            calAvg
        );

    resAvgLabel.textContent =
        formatMbq(
            resAvg
        );

    actualLabel.textContent =
        formatMbq(
            actual
        );

    diffLabel.textContent =
        formatDiff(
            difference
        );

    const reachMinutes =
        calcReachMinutes(
            actual,
            target,
            half
        );

    const reachTime =
        baseTime +
        reachMinutes;

    reachLabel.textContent =
        minutesToHms(
            reachTime
        );

    const now =
        new Date();

    const nowMinutes =
        (
            now.getHours()
            * 60
        )
        +
        now.getMinutes()
        +
        (
            now.getSeconds()
            / 60
        );

    const remainSeconds =
        Math.floor(
            (
                reachTime
                -
                nowMinutes
            )
            *
            60
        );

    if(
        remainSeconds <= 0
    ){

        countdownLabel.textContent =
            "開始可能";

    }
    else{

        countdownLabel.textContent =
            Math.floor(
                remainSeconds
                /
                60
            )
            +
            "分 "
            +
            (
                remainSeconds
                %
                60
            )
            +
            "秒";

    }

    statusLabel.textContent =
        "正常";

    statusLabel.style.color =
        "green";

}
catch(ex){

    statusLabel.textContent =
        ex.message;

    statusLabel.style.color =
        "red";

}


}

targetInput.addEventListener(
"input",
()=>{

    saveState();

    calculate();

}
);

workInput.addEventListener(
"input",
()=>{


    saveState();

    calculate();

}
);

halfInput.addEventListener(
"input",
()=>{


    saveState();

    calculate();

}
);

initializeTables();

restoreState();

calculate();

setInterval(
calculate,
1000
);
