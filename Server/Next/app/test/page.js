"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { fetchQuestions, sendAnswers } from "./app";
import { useLanguage } from "../language";
import { testText, translateQuestion } from "./translations";
import { kazakhCareers, kazakhCharacteristics } from "./careers-kk";

function imagePath(filename) {
    return filename ? `/images/${filename}` : "";
}

// Преобразование данных JSON в вопросы компонента
function transformQuestions(serverQuestions) {
    if (!Array.isArray(serverQuestions)) return [];

    return serverQuestions.map((q, index) => {
        const isLast = index === serverQuestions.length - 1;

        switch (q.type) {
            case "cards":
                return cardsQuestion(q.question, q.answers);
            case "swipe":
                return swipeQuestion(q.question, q.image, q.text);
            case "compare":
                return compareQuestion(q.question, q.left, q.right);
            case "rate":
                return rateQuestion(q.question, isLast);
            default:
                return null;
        }
    }).filter(q => q !== null);
}

export default function TestPage() {
    const language = useLanguage();
    const copy = testText[language];
    const answers = useRef([]);
    const [current, setCurrent] = useState(0);
    const [feedback, setFeedback] = useState(null);
    const [animKey, setAnimKey] = useState(0);
    const [dragX, setDragX] = useState(0);
    const dragStartX = useRef(null);
    const [transitioning, setTransitioning] = useState(false);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [finishStep, setFinishStep] = useState("name");
    const [userName, setUserName] = useState("");
    const [school, setSchool] = useState("");
    const [saveError, setSaveError] = useState(false);
    const saving = useRef(false);
    const [results, setResults] = useState(null);
    const schoolName = school.trim();
    const questionsForLanguage = useMemo(() => transformQuestions(translateQuestion(questions, language)), [questions, language]);

    // Загружаем вопросы из локального JSON при загрузке компонента
    useEffect(() => {
        async function loadQuestions() {
            setLoading(true);
            const rawData = await fetchQuestions();
            setQuestions(rawData);
            setLoading(false);
        }
        loadQuestions();
    }, []);

    // Переход на следующий вопрос
    const goNext = useCallback(
        (answer) => {
            if (transitioning) return;

            answers.current.push(answer);

            setTransitioning(true);
            setFeedback("yes");

            setTimeout(() => {
                setFeedback(null);
                setCurrent((c) => c + 1);
                setAnimKey((k) => k + 1);
                setDragX(0);

                setTimeout(() => {
                    setTransitioning(false);
                }, 100);
            }, 380);
        },
        [transitioning]
    );

    // Завершение теста
    const goFinish = useCallback(
        (answer) => {
            if (transitioning) return;

            answers.current.push(answer);

            setTransitioning(true);
            setFeedback("yes");

            setTimeout(async () => {
                setCurrent(questions.length);
                setFinishStep("name");

                setTransitioning(false);
                setFeedback(null);
            }, 400);
        },
        [transitioning, questions.length]
    );

    const progress = questions.length > 0 ? (current / questions.length) * 100 : 0;

    // Показываем экран загрузки если вопросы еще загружаются
    if (loading) {
        return (
            <>
                <main className="testPage">
                    <div className="progressBlock">
                        <p>{copy.loading}</p>
                    </div>
                </main>
            </>
        );
    }

    // Если вопросы не загрузились вообще
    if (questions.length === 0) {
        return (
            <>
                <main className="testPage">
                    <div className="progressBlock">
                        <p>{copy.loadError}</p>
                    </div>
                </main>
            </>
        );
    }

    async function startCalculation() {
        const name = userName.trim();
        if (!name || !schoolName || saving.current) return;

        saving.current = true;
        setUserName(name);
        setSaveError(false);
        setFinishStep("loading");

        try {
            const saved = await sendAnswers(answers.current, name, schoolName);

            setResults(saved?.result || {});
            answers.current = [];
            setFinishStep("results");
        } catch (error) {
            console.error("Не удалось сохранить ответы:", error);
            setFinishStep("name");
            setSaveError(true);
        } finally {
            saving.current = false;
        }
    }

    // Экран после завершения
    if (current >= questions.length) {
        if (finishStep === "name") {
            return (
                <>
                    <main className="testPage finish">
                        <div className="finishBox nameBox">
                            <h1>{copy.finished}</h1>
                            <p>{copy.enterDetails}</p>
                            <form className="participantForm" onSubmit={(event) => {
                                event.preventDefault();
                                startCalculation();
                            }}>
                                <label htmlFor="participantName">{copy.name}</label>
                                <input
                                    id="participantName"
                                    name="name"
                                    className="participantInput"
                                    value={userName}
                                    onChange={(event) => setUserName(event.target.value)}
                                    placeholder={copy.namePlaceholder}
                                    autoComplete="name"
                                    required
                                    maxLength={120}
                                    pattern={".*\\S.*"}
                                />
                                <label htmlFor="participantSchool">{copy.school}</label>
                                <input
                                    id="participantSchool"
                                    name="school"
                                    className="participantInput"
                                    value={school}
                                    onChange={(event) => setSchool(event.target.value)}
                                    placeholder={copy.schoolPlaceholder}
                                    required
                                    maxLength={200}
                                    pattern={".*\\S.*"}
                                />
                                {saveError && <p className="saveError" role="alert">{copy.saveError}</p>}
                                <button className="finishBtn" type="submit" disabled={!userName.trim() || !schoolName}>
                                    {copy.continue}
                                </button>
                            </form>
                        </div>
                    </main>
                </>
            );
        }

        if (finishStep === "loading") {
            return (
                <>
                    <main className="testPage finish">
                        <div className="finishBox loadingBox">
                            <h1>{copy.saving}</h1>
                            <div className="loadingLine" />
                            <p>{copy.preparing}</p>
                        </div>
                    </main>
                </>
            );
        }

        return (
            <>
                <main className="testPage finish">
                    <div className="finishBox resultsBox">
                        <h1>{userName || copy.participant}</h1>
                        <div className="resultList">
                            {characteristics.map((item) => (
                                <div className="resultItem" key={item.key}>
                                    <div className="resultHeader">
                                        <span>{characteristicLabel(item, language)}</span>
                                        <strong>{formatResult(resultValue(results, item.key))}/10</strong>
                                    </div>
                                    <div className="resultScale">
                                        <div
                                            className="resultFill"
                                            style={{ width: `${resultPercent(resultValue(results, item.key))}%` }}
                                        />
                                        <span className="scaleStart">0</span>
                                        <span className="scaleEnd">10</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="recommendation">{getRecommendation(results, language)}</div>
                    </div>
                </main>
            </>
        );
    }

    const isCurrentLast = current === questions.length - 1;

    return (
        <main
            className={`testPage ${
                feedback ? "flash" : ""
            }`}
        >
            <div className="progressBlock">
                <div className="progressBar">
                    <div
                        className="progressFill"
                        style={{
                            width: `${progress}%`
                        }}
                    />
                </div>

                <p>
                    {copy.question} {current + 1} / {questions.length}
                </p>
            </div>

            <div
                key={animKey}
                className="questionWrapper"
            >
                {questionsForLanguage[current].render({
                    next: isCurrentLast ? goFinish : goNext,
                    dragX,
                    setDragX,
                    dragStartX,
                    finish: goFinish,
                    copy
                })}
            </div>
        </main>
    );
}

/* =========================
   CARD TYPE
========================= */
function cardsQuestion(title, cards) {
    return {
        render({ next }) {
            return (
                <div className="questionContainer">
                    <h2>{title}</h2>
                    <div className="cardsGrid">
                        {cards && cards.map((c, i) => (
                            <div
                                key={i}
                                className="choiceCard"
                                onClick={() => next(i + 1)}
                            >
                                <img
                                    src={imagePath(c.image)}
                                    alt={c.text}
                                />
                                <h3>{c.text}</h3>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
    };
}

/* =========================
   SWIPE TYPE
========================= */
function swipeQuestion(title, image, text) {
    return {
        render({ next, dragX, setDragX, dragStartX, copy }) {
            function onDown(e) {
                dragStartX.current = e.clientX;
                e.currentTarget.setPointerCapture(e.pointerId);
            }

            function onMove(e) {
                if (dragStartX.current === null) return;
                setDragX(Math.max(-180, Math.min(180, e.clientX - dragStartX.current)));
            }

            function endSwipe(e) {
                if (dragStartX.current === null) return;
                const distance = e.clientX - dragStartX.current;
                dragStartX.current = null;
                try {
                    e.currentTarget.releasePointerCapture(e.pointerId);
                } catch {}

                if (distance > 120) {
                    next(1);
                } else if (distance < -120) {
                    next(2);
                }
                setDragX(0);
            }

            function cancelSwipe() {
                dragStartX.current = null;
                setDragX(0);
            }

            return (
                <div className="questionContainer">
                    <h2>{title}</h2>
                    <div
                        className="swipeCard single"
                        style={{
                            transform: `translateX(${dragX}px) rotate(${dragX / 20}deg)`
                        }}
                        onPointerDown={onDown}
                        onPointerMove={onMove}
                        onPointerUp={endSwipe}
                        onPointerCancel={cancelSwipe}
                    >
                        <img
                            src={imagePath(image)}
                            alt={text}
                        />
                        <h3>{text}</h3>
                        <div className="swipeHints">
                            <span className="no">← {copy.no}</span>
                            <span className="yes">{copy.yes} →</span>
                        </div>
                    </div>
                    <div className="swipeActions">
                        <button type="button" onClick={() => next(2)}>{copy.no}</button>
                        <button type="button" onClick={() => next(1)}>{copy.yes}</button>
                    </div>
                </div>
            );
        }
    };
}

/* =========================
   COMPARE TYPE
========================= */
function compareQuestion(title, left, right) {
    return {
        render({ next }) {
            return (
                <div className="questionContainer">
                    <h2>{title}</h2>
                    <div className="compareBlock">
                        <div className="compareCard" onClick={() => next(false)}>
                            <img
                                src={imagePath(left.image)}
                                alt={left.text}
                            />
                            <h3>{left.text}</h3>
                        </div>
                        <div className="compareCard" onClick={() => next(true)}>
                            <img
                                src={imagePath(right.image)}
                                alt={right.text}
                            />
                            <h3>{right.text}</h3>
                        </div>
                    </div>
                </div>
            );
        }
    };
}

/* =========================
   RATE TYPE
========================= */
function rateQuestion(title, isLast) {
    return {
        render({ next, finish, copy }) {
            return (
                <div className="questionContainer">
                    <h2>{title}</h2>
                    <div className="rateBlock">
                        {copy.ratings.map((v, i) => (
                            <button
                                key={i}
                                className="rateBtn"
                                onClick={() => {
                                    if (isLast) {
                                        finish(i + 1);
                                    } else {
                                        next(i + 1);
                                    }
                                }}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                </div>
            );
        }
    };
}

const characteristics = [
    { key: "adaptive", label: "Адаптация" },
    { key: "organizationable", label: "Организованность" },
    { key: "stress ability", label: "Стрессоустойчивость" },
    { key: "communicable", label: "Коммуникабельность" },
    { key: "Learnability", label: "Обучаемость" },
    { key: "Responsability", label: "Ответственность" },
    { key: "discipline", label: "Дисциплина" }
];

function formatResult(value) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, Math.min(10, number)) : 0;
}

function resultPercent(value) {
    return formatResult(value) * 10;
}

function resultValue(result, key) {
    const aliases = {
        adaptive: ["adaptive", "адаптация", "adaptation"],
        organizationable: ["organizationable", "организованность", "организация"],
        "stress ability": ["stress ability", "stressAbility", "стрессоустойчивость"],
        communicable: ["communicable", "коммуникабельность"],
        Learnability: ["Learnability", "learnability", "обучаемость"],
        Responsability: ["Responsability", "responsability", "responsibility", "ответственность"],
        discipline: ["discipline", "дисциплина"]
    };

    const source = result || {};
    const foundKey = aliases[key].find((alias) => source[alias] !== undefined);
    return foundKey ? source[foundKey] : 0;
}

function characteristicLabel(item, language) {
    return language === "kk" ? kazakhCharacteristics[item.key] : item.label;
}

function careerRecommendation({ profession, direction, reason, tasks, environment, growth, advice, ranking, language }) {
    const qualities = (items) => items.map((item, index) => (
        <span key={item.key}>
            {index > 0 ? ", " : ""}<strong>{characteristicLabel(item, language).toLowerCase()}</strong> ({item.value}/10)
        </span>
    ));

    if (language === "kk") {
        const [title, field, why, duties, workplace, tryIt, roles] = kazakhCareers[profession];
        return (
            <>
                <p>Сізге «{field}» бағытындағы <strong>{title}</strong> мамандығы сай келуі мүмкін. {why}</p>
                <p>Басым қасиеттеріңіз: {qualities(ranking.leading)}. Сізге көмектесетін басқа қасиеттер: {qualities(ranking.supporting)}. Дамытуға болатын қасиеттер: {qualities(ranking.growth)}. Оларды тәжірибе арқылы біртіндеп жетілдіре аласыз.</p>
                <p>Негізгі міндеттері: {duties}. {workplace}</p>
                <p>Өзіңізді осы бағытта сынап көру үшін {tryIt}. Кейін мына рөлдерде жұмыс істей аласыз: {roles}.</p>
                <p>Нәтиже қазіргі қасиеттеріңізді көрсетеді. Тәжірибе жинаған сайын қызығушылықтарыңыз бен сізге лайық бағыт өзгеруі мүмкін.</p>
            </>
        );
    }

    return (
        <>
            <p>Вам может подойти профессия <strong>{profession.toLowerCase()}</strong> в направлении «{direction}»: {reason}</p>
            <p>Ваши ведущие качества — {qualities(ranking.leading)}. Дополнительно вас поддерживают {qualities(ranking.supporting)}. Зоны роста — {qualities(ranking.growth)}. Их можно постепенно развивать на практике.</p>
            <p>В этой профессии вы будете заниматься такими задачами: {tasks}. Вам подойдёт среда, где {environment}.</p>
            <p>Чтобы попробовать себя в этом направлении, {advice}. В дальнейшем возможны такие роли: {growth}.</p>
            <p>Результат отражает ваши текущие качества. С новым опытом интересы и подходящее направление могут измениться.</p>
        </>
    );
}

function getRecommendation(result, language) {
    const ranked = [...characteristics]
        .sort((first, second) => resultValue(result, second.key) - resultValue(result, first.key));
    const top = ranked.slice(0, 3).map((item) => item.key);
    const ranking = {
        leading: ranked.slice(0, 2).map((item) => ({ ...item, value: formatResult(resultValue(result, item.key)) })),
        supporting: ranked.slice(2, 4).map((item) => ({ ...item, value: formatResult(resultValue(result, item.key)) })),
        growth: ranked.slice(4).map((item) => ({ ...item, value: formatResult(resultValue(result, item.key)) }))
    };
    const has = (...keys) => keys.every((key) => top.includes(key));
    const profiles = [
        [() => has("communicable", "Responsability"), {
            profession: "Руководитель проекта", direction: "управление и коммуникации",
            reason: <><strong>коммуникабельность</strong> и <strong>ответственность</strong> стоят выше остальных показателей.</>,
            tasks: "распределение задач, переговоры, контроль сроков и координация команды",
            environment: "нужно много общаться, принимать решения и доводить договорённости до результата",
            advice: "возьмите небольшой командный проект и ведите его по плану от постановки цели до итогового отчёта",
            growth: "проджект-менеджер, руководитель отдела или операционный директор"
        }],
        [() => has("Learnability", "adaptive"), {
            profession: "Программист", direction: "разработка цифровых продуктов",
            reason: <><strong>обучаемость</strong> и <strong>адаптивность</strong> позволяют быстро осваивать новые технологии.</>,
            tasks: "изучение языков программирования, написание кода, поиск ошибок и улучшение продукта",
            environment: "можно постоянно учиться, экспериментировать и спокойно разбирать сложные задачи",
            advice: "создайте один небольшой проект на GitHub и доведите его до работающей версии",
            growth: "разработчик, архитектор программного обеспечения или технический руководитель"
        }],
        [() => has("stress ability", "Responsability"), {
            profession: "Врач", direction: "медицина и помощь людям",
            reason: <><strong>стрессоустойчивость</strong> и <strong>ответственность</strong> особенно важны там, где решения влияют на других.</>,
            tasks: "анализ симптомов, принятие решений, общение с пациентами и ведение медицинской документации",
            environment: "требуются дисциплина, концентрация и уважительное отношение к человеку в трудной ситуации",
            advice: "изучите направления медицины и попробуйте волонтёрскую или учебную практику, связанную с заботой о людях",
            growth: "врач узкой специализации, заведующий отделением или медицинский эксперт"
        }],
        [() => has("adaptive", "organizationable"), {
            profession: "Инженер", direction: "технические системы и проектирование",
            reason: <><strong>адаптивность</strong> помогает находить решения, а <strong>организованность</strong> удерживает проект в рамках.</>,
            tasks: "расчёты, проектирование, проверка решений и поиск причин технических проблем",
            environment: "ценятся точность, логика, последовательность и готовность тестировать разные варианты",
            advice: "соберите учебный технический проект и оформите его чертежами, расчётами или прототипом",
            growth: "инженер-конструктор, системный инженер или технический руководитель"
        }],
        [() => has("Learnability", "organizationable"), {
            profession: "Аналитик данных", direction: "исследования и работа с информацией",
            reason: <><strong>обучаемость</strong> помогает осваивать инструменты, а <strong>организованность</strong> превращает данные в выводы.</>,
            tasks: "сбор данных, поиск закономерностей, построение отчётов и объяснение результатов",
            environment: "есть время проверять гипотезы и переводить сложную информацию на понятный язык",
            advice: "возьмите открытый набор данных, очистите его и подготовьте короткий отчёт с тремя выводами",
            growth: "аналитик продукта, бизнес-аналитик или руководитель исследовательской команды"
        }],
        [() => has("communicable", "adaptive"), {
            profession: "HR-специалист", direction: "люди, подбор и развитие команд",
            reason: <><strong>коммуникабельность</strong> помогает понимать людей, а <strong>адаптивность</strong> помогает работать с разными ситуациями.</>,
            tasks: "собеседования, адаптация сотрудников, обратная связь и развитие корпоративной культуры",
            environment: "нужно много слушать, задавать точные вопросы и быстро подстраивать подход",
            advice: "потренируйтесь проводить структурированное интервью и составьте профиль подходящего кандидата",
            growth: "HR-бизнес-партнёр, руководитель направления или консультант по развитию персонала"
        }],
        [() => has("communicable", "stress ability"), {
            profession: "Юрист", direction: "право, переговоры и защита интересов",
            reason: <><strong>коммуникабельность</strong> сочетается со способностью сохранять ясность в напряжённых обстоятельствах.</>,
            tasks: "анализ документов, аргументация, переговоры и подготовка правовых решений",
            environment: "важны точность формулировок, выдержка и готовность отстаивать позицию фактами",
            advice: "разберите учебный кейс, найдите аргументы обеих сторон и составьте короткое правовое заключение",
            growth: "юрист-консультант, адвокат или руководитель юридической практики"
        }],
        [() => has("organizationable", "discipline"), {
            profession: "Бухгалтер", direction: "финансы и порядок в документах",
            reason: <><strong>организованность</strong> и <strong>дисциплина</strong> заметно превосходят качества, связанные с импровизацией.</>,
            tasks: "проверка операций, ведение отчётности, работа с документами и контроль сроков",
            environment: "нужны понятные правила, внимательность к деталям и стабильный рабочий ритм",
            advice: "освойте базовую финансовую таблицу и потренируйтесь проверять её на ошибки",
            growth: "главный бухгалтер, финансовый контролёр или специалист по аудиту"
        }],
        [() => has("stress ability", "adaptive"), {
            profession: "Предприниматель", direction: "бизнес и самостоятельные решения",
            reason: <><strong>стрессоустойчивость</strong> и <strong>адаптивность</strong> помогают действовать, когда готового сценария нет.</>,
            tasks: "поиск идеи, общение с клиентами, проверка спроса и управление ресурсами",
            environment: "приходится принимать неопределённость, быстро учиться и отвечать за итог лично",
            advice: "проверьте одну бизнес-идею через десять разговоров с потенциальными пользователями",
            growth: "основатель проекта, руководитель бизнеса или продуктовый предприниматель"
        }],
        [() => has("Learnability", "discipline"), {
            profession: "Исследователь", direction: "наука, эксперименты и новые знания",
            reason: <><strong>обучаемость</strong> сочетается с <strong>дисциплиной</strong>, необходимой для длинной последовательной работы.</>,
            tasks: "формулировка вопросов, изучение источников, проведение экспериментов и оформление выводов",
            environment: "можно долго разбираться в теме, проверять гипотезы и фиксировать каждый результат",
            advice: "выберите вопрос, составьте план мини-исследования и опишите результаты с указанием источников",
            growth: "научный сотрудник, R&D-специалист или эксперт по исследованиям"
        }],
        [() => has("organizationable", "stress ability"), {
            profession: "Тестировщик", direction: "качество продуктов и процессов",
            reason: <><strong>организованность</strong> помогает замечать детали, а <strong>стрессоустойчивость</strong> не даёт сдаться при повторных проверках.</>,
            tasks: "поиск ошибок, составление сценариев, проверка требований и описание багов",
            environment: "важны последовательность, внимательность и спокойная работа с большим числом деталей",
            advice: "возьмите знакомое приложение и составьте для него десять тестовых сценариев с ожидаемым результатом",
            growth: "QA-инженер, автоматизатор тестирования или руководитель команды качества"
        }]
    ];

    const selected = profiles.find(([match]) => match());
    if (selected) return careerRecommendation({ ...selected[1], ranking, language });

    return careerRecommendation({
        profession: "Графический дизайнер", direction: "визуальные коммуникации и создание идей",
        reason: <>показатели распределены достаточно ровно, поэтому у вас есть гибкость и возможность развиваться в разных ролях.</>,
        tasks: "поиск концепции, работа с визуальными материалами, композиция и презентация решений",
        environment: "можно сочетать самостоятельность, интерес к людям и постоянное развитие вкуса",
        advice: "соберите небольшое портфолио из трёх работ и объясните идею каждой из них",
        growth: "графический дизайнер, арт-директор или специалист по визуальному брендингу",
        ranking, language
    });
}
