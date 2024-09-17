import { useEffect, useRef, useState } from "react";
import CloseIcon from "./components/icons/CloseIcon";
import ChatbotIcon from "./components/icons/ChatbotIcon";
import MessageIcon from "./components/icons/MessageIcon";
import { useChatStore } from "./store/chatStore";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";

type Flow = {
  messages: string[];
  options?: { label: string; value: string }[];
  triggers?: string[];
  isForm?: boolean;
  valueForm?: string;
  nextFlow?: string;
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
    valueForm: "name",
    //options: [],
    nextFlow: "formulario_apellido",
    //nextFlows: {},
  },
  formulario_apellido: {
    messages: ["Cual es tu apellido?"],
    isForm: true,
    valueForm: "lastname",
    nextFlow: "formulario_enviar",
    //options: [],
  },
  formulario_enviar: {
    messages: ["Los datos ingresados son correctos:"],
    options: [
      { label: "Si", value: "enviar_formulario" },
      { label: "No", value: "formulario_nombre" },
    ],
    isForm: true,
  },
  enviar_formulario: {
    messages: ["¡Gracias! Enviando tus datos...", "Desea consultar algo mas?"],
    options: [
      { label: "Soporte", value: "soporte" },
      { label: "No", value: "despedida" },
    ],
    isForm: true,
    action: () => {
      const responses = useChatStore.getState().userResponses;
      console.log("Enviando datos:", responses);
    },
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
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, addMessage, currentFlow, setFlow, addResponse } =
    useChatStore();

  const flow = FLOWS[currentFlow];

  const sendBotMessage = (text: string, delay: number) => {
    setShowOptions(false);
    setTimeout(() => {
      addMessage({ text: text, from: "bot" });
    }, delay);
  };

  const handleClick = (option: { label: string; value: string }) => {
    addMessage({ text: option.label, from: "user" });

    changeFlow(option.value);
    const newFlow = FLOWS[option.value];
    if (
      newFlow.action &&
      newFlow.isForm &&
      option.value === "enviar_formulario"
    ) {
      newFlow.action();
    }
  };

  const changeFlow = (newFlow: string) => {
    setFlow(newFlow);
    const flow = FLOWS[newFlow];
    const totalDelay = flow.messages.length * 1000 + 500;

    flow.messages.forEach((message, index) =>
      sendBotMessage(message, 1000 * (index + 1))
    );
    setTimeout(() => {
      setShowOptions(true);
    }, totalDelay);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (input.trim()) {
      setShowOptions(false);
      const userMessage = input.trim();

      addMessage({ from: "user", text: userMessage });
      setInput("");

      if (currentFlow === "soporte") {
        console.log("estamos en soporte");
        socket?.emit("newMessage", userMessage);
        return;
      }

      if (flow.isForm) {
        if (flow.valueForm) {
          addResponse(flow.valueForm, input);
        }

        if (flow.nextFlow) {
          changeFlow(flow.nextFlow);
        }
        return;
      }

      const trigger = findTrigger(userMessage);
      if (trigger) {
        changeFlow(trigger);
      }
    }
  };

  useEffect(() => {
    if (currentFlow === "soporte") {
      console.log("conectandoo");
      const newSocket = io("http://localhost:4000");
      setSocket(newSocket);
      newSocket.on("message", (message) => {
        console.log(message);

        addMessage({ from: "bot", text: message });
      });
      return () => {
        newSocket.disconnect();
        setSocket(null);
      };
    }
  }, [currentFlow]);

  useEffect(() => {
    if (messages) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, showOptions]);

  useEffect(() => {
    if (currentFlow === "bienvenida") {
      changeFlow(currentFlow);
    }
  }, []);

  return (
    <>
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0, height: "0px" }}
            animate={{ opacity: 1, height: "500px" }}
            exit={{ opacity: 0, height: "0px" }}
            className="w-[350px] h-[500px] fixed flex flex-col bottom-20 right-4 bg-red-200 rounded-xl"
          >
            <div className="bg-red-700 text-white p-2 px-3 flex items-center rounded-t-xl">
              <h2 className="text-xl font-bold">Chat V2</h2>
            </div>
            <div className="flex-grow bg-red-200 p-4 flex flex-col gap-1 overflow-auto">
              {messages.map((message, index) => (
                <motion.div
                  initial={{ opacity: 0.3, translateY: "3px" }}
                  animate={{ opacity: 1, translateY: "0px" }}
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
                        : "bg-red-300 rounded-br-none"
                    }`}
                  >
                    {message.text}
                  </div>
                </motion.div>
              ))}
              <AnimatePresence>
                {showOptions &&
                  flow.options &&
                  flow.options.map((option, index) => (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ ease: "easeInOut" }}
                      onClick={() => handleClick(option)}
                      key={index}
                      className="p-2 px-5 w-fit text-sm font-medium rounded-lg border border-red-400 text-red-400 hover:text-white hover:bg-red-400 transition-colors"
                    >
                      {option.label}
                    </motion.button>
                  ))}
              </AnimatePresence>
              <div ref={messagesEndRef}></div>
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
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        initial={{ rotate: 0 }}
        animate={{ rotate: showChat ? 180 : 0 }}
        transition={{ duration: 0.5 }}
        className="fixed bottom-4 right-4 w-12 h-12 bg-red-800 grid place-content-center text-white rounded-full"
        onClick={() => setShowChat(!showChat)}
      >
        {showChat ? <CloseIcon /> : <ChatbotIcon />}
      </motion.button>
    </>
  );
};
export default Chatbot;
