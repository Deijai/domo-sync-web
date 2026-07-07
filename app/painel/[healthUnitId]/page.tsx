"use client"

import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { io } from "socket.io-client"
import { Volume2 } from "lucide-react"
import { publicQueueApi, QUEUE_SOCKET_URL } from "@/lib/api/queue"
import type { PublicQueueCall } from "@/types/api"

function speak(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = "pt-BR"
  const ptVoice = window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith("pt"))
  if (ptVoice) utterance.voice = ptVoice
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}

export default function QueuePanelPage() {
  const params = useParams<{ healthUnitId: string }>()
  const healthUnitId = params.healthUnitId

  const [unitName, setUnitName] = useState("")
  const [current, setCurrent] = useState<PublicQueueCall | null>(null)
  const [lastCalls, setLastCalls] = useState<PublicQueueCall[]>([])
  const [now, setNow] = useState<Date | null>(null)
  const [audioEnabled, setAudioEnabled] = useState(false)
  const audioEnabledRef = useRef(false)

  useEffect(() => {
    setNow(new Date())
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    let cancelled = false
    publicQueueApi.getPanel(healthUnitId).then((panel) => {
      if (cancelled) return
      setUnitName(panel.healthUnit.name)
      setCurrent(panel.current)
      setLastCalls(panel.lastCalls)
    })
    return () => {
      cancelled = true
    }
  }, [healthUnitId])

  useEffect(() => {
    const socket = io(QUEUE_SOCKET_URL, { query: { healthUnitId }, transports: ["websocket"] })

    socket.on("ticket.called", (payload: PublicQueueCall) => {
      setCurrent((prevCurrent) => {
        if (prevCurrent) {
          setLastCalls((prev) => [prevCurrent, ...prev].slice(0, 10))
        }
        return payload
      })

      if (audioEnabledRef.current) {
        const label = payload.batchLabel ?? payload.professionalName
        speak(`Senha ${spellTicket(payload.ticketNumber)}, ${label}, guichê ${payload.counterLabel}`)
      }
    })

    return () => {
      socket.disconnect()
    }
  }, [healthUnitId])

  function enableAudio() {
    audioEnabledRef.current = true
    setAudioEnabled(true)
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices()
      speak("Som ativado.")
    }
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-white text-black">
      <header className="flex items-center justify-between bg-black px-6 py-3 text-white">
        <span className="text-sm font-semibold sm:text-base">Aguarde sua senha ser chamada</span>
        <div className="flex items-center gap-6">
          <span className="text-sm sm:text-base">{unitName}</span>
          <span className="text-sm sm:text-base">{now ? now.toLocaleTimeString("pt-BR") : "--:--:--"}</span>
          <span className="text-sm sm:text-base">{now ? now.toLocaleDateString("pt-BR") : ""}</span>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-4 p-4 sm:grid-cols-3">
        <div className="flex flex-col justify-between rounded-md bg-blue-600 p-8 text-white sm:col-span-2">
          <div>
            <p className="text-2xl font-bold sm:text-3xl">SENHA</p>
            <p className="text-[18vw] font-black leading-none sm:text-[10rem]">{current?.ticketNumber ?? "—"}</p>
            {current && (
              <p className="mt-1 text-lg font-semibold sm:text-2xl">
                {current.batchLabel ?? current.professionalName}
              </p>
            )}
          </div>
          <div>
            <p className="text-2xl font-bold sm:text-3xl">GUICHÊ</p>
            <p className="text-[12vw] font-black leading-none sm:text-[6rem]">{current?.counterLabel ?? "—"}</p>
          </div>
        </div>

        <div className="rounded-md border-2 border-blue-600 p-4">
          <h2 className="mb-3 text-lg font-bold text-blue-600 sm:text-xl">ÚLTIMAS CHAMADAS</h2>
          <div className="grid grid-cols-[1fr_2fr_1fr] gap-2 text-sm font-semibold text-blue-600 sm:text-base">
            <span>SENHA</span>
            <span>LOTE</span>
            <span>GUICHÊ</span>
          </div>
          <div className="mt-2 space-y-2">
            {lastCalls.map((call, index) => (
              <div
                key={`${call.ticketNumber}-${index}`}
                className="grid grid-cols-[1fr_2fr_1fr] gap-2 text-sm text-blue-700"
              >
                <span>{call.ticketNumber}</span>
                <span className="truncate">{call.batchLabel ?? call.professionalName}</span>
                <span>- {call.counterLabel}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {!audioEnabled && (
        <button
          onClick={enableAudio}
          className="fixed bottom-4 right-4 flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg"
        >
          <Volume2 className="size-4" /> Ativar som
        </button>
      )}
    </div>
  )
}

function spellTicket(ticketNumber: string): string {
  return ticketNumber.split("").join(" ")
}
