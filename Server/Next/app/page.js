"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "./language";

const collage1 = "/images/collage1.png";
const collage2 = "/images/collage2.png";
const prof = "/images/prof.png";

export default function Home() {
  const kk = useLanguage() === "kk";

  const branches = [
    {
      image: collage1,
      title: kk ? "А корпусы" : "Корпус A",
      text: kk ? "IT бағыттары, зертханалары және практикалық сабақтары бар заманауи колледж." : "Современный колледж с IT направлениями, лабораториями и практическим обучением.",
      address: kk ? "Семей қаласы, Затаевич көшесі, 4" : "г. Семей, ул. Затаевича, 4"
    },
    {
      image: collage2,
      title: kk ? "B корпусы" : "Корпус B",
      text: kk ? "Мамандар даярлаудың қосымша бағдарламалары бар оқу корпусы." : "Учебный корпус с дополнительными программами подготовки специалистов.",
      address: kk ? "Семей қаласы, Челюскинцев көшесі, 46а" : "г. Семей, ул. Челюскинцева, 46а"
    }
  ];

  const [current, setCurrent] = useState(0);

  function nextSlide() {
    setCurrent((current + 1) % branches.length);
  }

  function prevSlide() {
    setCurrent(current === 0 ? branches.length - 1 : current - 1);
  }

  return (
    <main>

      <section className="hero" id="prof">

        <div className="heroText">
          <h1>{kk ? "Кәсіптік бағдар" : "Профориентирование"}</h1>

          <p>
            {kk ? "Тесттен өтіп, өзіңе сай бағыттарды анықта." : "Пройди современное тестирование и узнай, какие направления подходят именно тебе."}
          </p>

          <Link className="heroBtn" href="/test">{kk ? "Бастау" : "Начать"}</Link>
          
        </div>

        <img
          src={prof}
          alt=""
          className="heroImage"
        />

      </section>

      <section className="advantages">

        <div className="card">
          <h3>{kk ? "Өзіңді таны" : "Узнай, кто ты"}</h3>
          <p>{kk ? "Нәтижеңнің толық талдауын ал." : "Получи подробный анализ."}</p>
        </div>

        <div className="card">
          <h3>{kk ? "Сенің тұлғалық типің" : "Твой тип"}</h3>
          <p>{kk ? "Мықты тұстарыңды анықта." : "Определи свои сильные стороны."}</p>
        </div>

        <div className="card">
          <h3>{kk ? "Сенің мінезің" : "Твоя личность"}</h3>
          <p>{kk ? "Мінезіңнің ерекшеліктерін біл." : "Узнай особенности характера."}</p>
        </div>

        <div className="card">
          <h3>{kk ? "Сенің ойлау қабілетің" : "Твой склад ума"}</h3>
          <p>{kk ? "Өзіңе лайық мамандықтарды тап." : "Определи подходящие профессии."}</p>
        </div>

      </section>

      <section className="about" id="about">

        <h2>{kk ? "Біз туралы" : "О нас"}</h2>

        <div className="collegeBlock">

          <img
            src={branches[current].image}
            alt={branches[current].title}
            className="collegeImage"
          />

          <div className="collegeInfo">

            <h3>{branches[current].title}</h3>

            <p>{branches[current].text}</p>

            <h4>{kk ? "Колледж туралы" : "О колледже"}</h4>

            <p>
              {kk ? "Біз заманауи бағыттар бойынша мамандар даярлап, студенттерге сұранысқа ие дағдыларды меңгеруге көмектесеміз." : "Мы готовим специалистов по современным направлениям и помогаем студентам получить востребованные навыки."}
            </p>

            <h4>{kk ? "Мекенжай" : "Адрес"}</h4>

            <p>{branches[current].address}</p>

            <div className="sliderButtons">
              <button aria-label={kk ? "Алдыңғы корпус" : "Предыдущий корпус"} onClick={prevSlide}>←</button>
              <button aria-label={kk ? "Келесі корпус" : "Следующий корпус"} onClick={nextSlide}>→</button>
            </div>

          </div>

        </div>

      </section>

      <footer>

        <h2>{kk ? "Сұрақтарыңыз болса, бізге хабарласыңыз!" : "Обращайтесь к нам, если есть вопросы!"}</h2>

        <div className="contactBlock">
          <p>+7 (777) 123-45-67</p>
          <p>college@mail.kz</p>
        </div>

        <p><Link className="Hehe" href="https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=RDdQw4w9WgXcQ&start_radio=1">FREE Robux</Link></p>

      </footer>

    </main>
  );
}
