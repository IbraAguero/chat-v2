import { useEffect, useState } from "react";
import CloseIcon from "./components/icons/CloseIcon";
import ChatbotIcon from "./components/icons/ChatbotIcon";
import MessageIcon from "./components/icons/MessageIcon";
import { useChatStore } from "./store/ChatStore";

/* type Message = {
  text: string;
  sender: "bot" | "user";
  //time: Date
}; */

type Flow = {
  messages: string[];
  options?: { label: string; value: string }[];
  triggers?: string[];
  isForm?: boolean;
  nextFlow?: string;
  //nextFlows: Record<string, string>;
  action?: () => void;
};

const FLOWS: Record<string, Flow> = {
  bienvenida: {
    messages: ["¡Hola! Soy el bot de Ibra", "¿Cómo te puedo ayudar hoy?"],
    options: [
      { label: "Hablar con soporte", value: "soporte" },
      { label: "Despedirse", value: "despedida" },
    ],
    triggers: ["hola", "buenos días", "buenas tardes"],
    /* nextFlows: {
      "Ver información personal": "informacion_personal",
      "Hablar con soporte": "soporte",
      Despedirse: "despedida",
    }, */
  },
  formulario_nombre: {
    messages: ["Cual es tu nombre?"],
    triggers: ["formulario"],
    isForm: true,
    //options: [],
    nextFlow: "formulario_apellido",
    //nextFlows: {},
  },
  formulario_apellido: {
    messages: ["Cual es tu apellido?"],
    isForm: true,
    nextFlow: "formulario_enviar",
    //options: [],
  },
  formulario_enviar: {
    messages: ["Los datos ingresados son correctos:"],
    options: [
      { label: "Si", value: "" },
      { label: "No", value: "formulario_nombre" },
    ],
    isForm: true,
    //nextFlows: {},
  },
  despedida: {
    messages: ["Hasta luego", "¡Espero que tengas un gran día!"],
    //options: [],
    triggers: ["adiós", "hasta luego", "chau"],
    //nextFlows: {},
  },
  soporte: {
    messages: ["Conectando al soporte..."],
    triggers: ["soporte"],
    //options: [],
    //nextFlows: {},
  },
};

const findTrigger = (message: string) => {
  for (const flowKey in FLOWS) {
    const flow = FLOWS[flowKey];
    if (
      flow.triggers &&
      flow.triggers.some((word: string) => message.toLowerCase().includes(word))
    ) {
      return flowKey;
    }
  }
  return null;
};

const Chatbot = () => {
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const [showChat, setShowChat] = useState(true);
  const [input, setInput] = useState<string>("");

  const {
    messages,
    addMessage,
    currentFlow,
    setFlow,
    userResponses,
    addResponse,
  } = useChatStore();

  const flow = FLOWS[currentFlow];
  console.log(userResponses);

  const sendBotMessage = (text: string, delay: number) => {
    setTimeout(() => {
      addMessage({ text: text, from: "bot" });
    }, delay);
  };

  const handleClick = (option: { label: string; value: string }) => {
    addMessage({ text: option.label, from: "user" });
    setFlow(option.value);
    const newFlow = FLOWS[option.value];

    newFlow.messages.forEach((message, index) =>
      sendBotMessage(message, 1000 * (index + 1))
    );
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (input.trim()) {
      setShowOptions(false);
      const userMessage = input.trim();

      addMessage({ from: "user", text: userMessage });
      setInput("");

      if (flow.isForm) {
        addResponse(currentFlow, input);

        if (flow.nextFlow) {
          setFlow(flow.nextFlow);
          const newFlow = FLOWS[flow.nextFlow];

          const totalDelay = newFlow.messages.length * 1000;
          newFlow.messages.forEach((message, index) =>
            sendBotMessage(message, 1000 * (index + 1))
          );
          setTimeout(() => {
            setShowOptions(true);
          }, totalDelay);
        }
      }

      const trigger = findTrigger(userMessage);
      if (trigger) {
        setFlow(trigger);
        const newFlow = FLOWS[trigger];
        const totalDelay = newFlow.messages.length * 1000;

        newFlow.messages.forEach((message, index) =>
          sendBotMessage(message, 1000 * (index + 1))
        );
        setTimeout(() => {
          setShowOptions(true);
        }, totalDelay);
      }
    }
  };

  useEffect(() => {
    if (currentFlow === "bienvenida") {
      flow.messages.forEach((message, index) => {
        sendBotMessage(message, 1000 * (index + 1));
      });
      const totalDelay = flow.messages.length * 1000 + 1000;
      setTimeout(() => {
        setShowOptions(true);
      }, totalDelay);
    }
  }, []);

  /* useEffect(() => {
    let delay = 0;
    messagesInit.forEach((message) => {
      delay += 1200;
      sendBotMessage(message.text, delay);
    });
  }, []); */

  return (
    <>
      {showChat && (
        <div className="w-[350px] h-[500px] fixed flex flex-col bottom-20 right-4 bg-red-200 rounded-xl">
          <div className="bg-red-700 text-white p-2 px-3 flex items-center rounded-t-xl">
            <h2 className="text-xl font-bold">Chat V2</h2>
          </div>
          <div className="flex-grow bg-red-200 p-4 flex flex-col gap-1 overflow-auto">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.from === "bot" ? "justify-start" : "justify-end"
                }`}
              >
                <div
                  key={index}
                  className={`rounded-lg p-2 px-3 shadow-[0px_2px_8px_rgba(0,0,0,_0.1)] text-sm font-normal max-w-[85%] break-words ${
                    message.from === "bot"
                      ? "bg-red-100 rounded-bl-none"
                      : "bg-red-300 rounded-br-none my-1.5"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            {showOptions &&
              flow.options &&
              flow.options.map((option, index) => (
                <button
                  onClick={() => handleClick(option)}
                  key={index}
                  className="p-2 px-5 w-fit text-sm font-medium rounded-lg border border-red-400 text-red-400 hover:text-white hover:bg-red-400 transition-colors"
                >
                  {option.label}
                </button>
              ))}
          </div>
          <div className="bg-red-500 rounded-b-xl p-2 px-4">
            <form
              onSubmit={handleSubmit}
              className="flex items-center justify-between"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                type="text"
                placeholder="Escribe acá.."
                className="flex-grow bg-transparent text-white outline-none placeholder:text-white"
              />
              <button className="p-1">
                <MessageIcon />
              </button>
            </form>
          </div>
        </div>
      )}
      <button
        className="fixed bottom-4 right-4 w-12 h-12 bg-red-800 grid place-content-center text-white rounded-full"
        onClick={() => setShowChat(!showChat)}
      >
        {showChat ? <CloseIcon /> : <ChatbotIcon />}
      </button>
    </>
  );
};
export default Chatbot;
