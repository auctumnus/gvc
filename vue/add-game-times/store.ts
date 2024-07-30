import { defineStore } from "pinia";
import { GameTime, GameTimeData } from "./types";

const initialData = JSON.parse(
    document.getElementById("game-times-data")!.textContent!,
  ) as GameTimeData

export const useDataStore = defineStore('data', {
    state: () => ({
        ...initialData,
        focusedGameTime: null as number | null
    }),
    actions: {
        async editTime(id: number, start: number, end: number) {
            try {
                const body = { start, end }
                const url = window.location.pathname
                const response = await fetch(`${url}/${id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(body)
                })
                if(!response.ok) {
                    throw new Error(await response.text())
                }
                this.current = this.current.map((time) => {
                    if (time.id === id) {
                        time.start = start;
                        time.end = end;
                    }
                    return time;
                });
            } catch(e) {
                console.error(e)
                alert(e)
            }
        },
        async addTime(s: number, e: number) {
            try {
                const body = { start: s, end: e }
                const url = window.location.pathname
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(body)
                })
                if(!response.ok) {
                    throw new Error(await response.text())
                }
                const responseBody = await response.json()
                const { id, start, end } = responseBody
                this.current.push({ id, start, end, entries_count: 0 })
            } catch(e) {
                console.error(e)
                alert(e)
            }
            
        },
        async removeTime(id: number) {
            try {
                const url = window.location.pathname
                const response = await fetch(`${url}/${id}`, {
                    method: 'DELETE'
                })
                if(!response.ok) {
                    throw new Error(await response.text())
                }
                this.current = this.current.filter((time) => time.id !== id);
            } catch(e) {
                console.error(e)
                alert(e)
            }
        },
        async focusGameTime(id: number) {
            this.unfocusGameTime()
            const el = document.getElementById(`game-time-${id}`)
            if(el) {
                if(!el.classList.contains('managed')) {
                    el.classList.add('focused')
                }
                el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                el.focus()
            }
            this.focusedGameTime = id
        },
        async unfocusGameTime() {
            const el = document.getElementById(`game-time-${this.focusedGameTime!}`)
            if(el && !el.classList.contains('managed')) {
                el.classList.remove('focused')
            }
            this.focusedGameTime = null
        }
    }
})