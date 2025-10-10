import { DraftStep } from '@/model/draftstep';
import { GameStatus } from '@/model/gamestatus';
import { PlayerAction } from '@/model/playerAction';
import { EventEmitter } from 'events'

export class GameService extends EventEmitter {
private lobbyId: string;
  private theme: number;

  private currentPlayer = "";
  private phase = "";
  private secondsLeft = 30;
  private TURN_SECONDS = 90;

  private bannedOperator: string[] = ["", "", "", "", "", "", ""];
  private bannedSquad: string[] = ["", ""];
  private picked: string[] = Array(10).fill("");
  private selectedOps = "";
  private selectedSquad = "";
  private allOperators: string[] = [];
  private allSquads: string[] = [];
  private pools: Record<string, string> = {};

  private draftOrder: DraftStep[] = [];
  private stepIndex = 0;

  constructor(lobbyId: string, theme: number) {
    super();
    this.lobbyId = lobbyId;
    this.theme = theme;

    this.draftOrder = [
      { phase: "BAN SQUAD", player: "Player 1", slot: "Ban Squad 1" },
      { phase: "BAN SQUAD", player: "Player 2", slot: "Ban Squad 2" },
      { phase: "BAN", player: "Player 2", slot: "Ban 2" },
      { phase: "BAN", player: "Player 1", slot: "Ban 1" },
      { phase: "BAN", player: "Player 1", slot: "Ban 3" },
      { phase: "BAN", player: "Player 2", slot: "Ban 4" },
      { phase: "BAN", player: "Player 2", slot: "Ban 6" },
      { phase: "BAN", player: "Player 1", slot: "Ban 5" },
      { phase: "PICK", player: "Player 1", slot: "Pick 1" },
      { phase: "PICK", player: "Player 2", slot: "Pick 2" },
      { phase: "PICK", player: "Player 2", slot: "Pick 4" },
      { phase: "PICK", player: "Player 1", slot: "Pick 3" },
      { phase: "PICK", player: "Player 1", slot: "Pick 5" },
      { phase: "PICK", player: "Player 2", slot: "Pick 6" },
      { phase: "PICK", player: "Player 2", slot: "Pick 8" },
      { phase: "PICK", player: "Player 1", slot: "Pick 7" },
      { phase: "PICK", player: "Player 1", slot: "Pick 9" },
      { phase: "PICK", player: "Player 2", slot: "Pick 10" },
    ];

    const firstStep = this.draftOrder[0];
    this.currentPlayer = firstStep.player;
    this.phase = firstStep.phase;
  }

  startDraft() {
    // Reset all draft state
    this.stepIndex = 0;
    this.currentPlayer = this.draftOrder[0].player;
    this.phase = this.draftOrder[0].phase;
    this.secondsLeft = this.TURN_SECONDS;

    this.bannedOperator = Array(6).fill("");
    this.bannedSquad = Array(2).fill("");
    this.picked = Array(10).fill("");
    this.selectedOps = "";
    this.selectedSquad = "";
    this.pools = {};

    // Emit initial status to listeners
    this.emitUpdate("status", this.getStatus());
    this.emitUpdate("theme", this.theme);
    this.emitUpdate("selectedOp", this.selectedOps);
    this.emitUpdate("selectedSquad", this.selectedSquad);
    this.emitUpdate("bannedSquad", this.bannedSquad);
    this.emitUpdate("bannedOps", this.bannedOperator);
    this.emitUpdate("picked", this.picked);
  }

  setPlayerAction(action: PlayerAction){
    if(action.squad != "") {
	    this.selectedSquad = action.squad;
		this.emitUpdate("selectedSquad", this.selectedSquad);
	}else if(action.character != "") {
		this.selectedOps = action.character;
		this.emitUpdate("selectedOp", this.selectedOps);
	}
  }

  handlePlayerAction(action: PlayerAction) {
    if (this.stepIndex >= this.draftOrder.length) return;

    const step = this.draftOrder[this.stepIndex];
    const slotIndex = this.getSlotIndex(step.slot);

    switch (action.type) {
      case "BAN SQUAD":
        this.bannedSquad[slotIndex] = action.squad ?? "";
        this.selectedSquad = "";
        this.emitUpdate("bannedSquad", this.bannedSquad);
        break;
      case "BAN":
        this.bannedOperator[slotIndex] = action.character ?? "";
        this.selectedOps = "";
        this.emitUpdate("bannedOps", this.bannedOperator);
        break;
      case "PICK":
        this.picked[slotIndex] = action.character ?? "";
        this.selectedOps = "";
        this.emitUpdate("picked", this.picked);
        break;
    }

    this.nextTurn();
  }

  private onGameEnd?: () => void;

  setOnGameEnd(callback: () => void) {
    this.onGameEnd = callback;
  }

  nextTurn() {
    this.stepIndex++;
    if (this.stepIndex < this.draftOrder.length) {
      const step = this.draftOrder[this.stepIndex];
      this.currentPlayer = step.player;
      this.phase = step.phase;
      this.secondsLeft = this.TURN_SECONDS;
      this.emitUpdate("status", this.getStatus());
    } else {
      this.currentPlayer = "";
      this.phase = "DONE";
      this.secondsLeft = 0;
      this.emitUpdate("end", { message: "Ban/Pick finished", secondsLeft: 30 });
    }
  }

  tick() {
    if (this.secondsLeft > 0) {
      this.secondsLeft--;
      if (this.secondsLeft === 0) this.randomSquadOrOperator();
      this.emitUpdate("status", this.getStatus());
    }
  }

  randomSquadOrOperator() {
    if (this.stepIndex >= this.draftOrder.length) return;
    // implement random selection logic if needed
  }

  getStatus(): GameStatus {
    const step = this.draftOrder[this.stepIndex] ?? { slot: "" };
    return {
      currentPlayer: this.currentPlayer,
      phase: this.phase,
      secondsLeft: this.secondsLeft,
      currentSlot: step.slot,
    };
  }

  emitUpdate(type: string, data: any) {
    this.emit(type, { lobbyId: this.lobbyId, data });
  }

  private getSlotIndex(slot: string): number {
    const map: Record<string, number> = {
      "Ban Squad 1": 0,
      "Ban Squad 2": 1,
      "Ban 1": 0,
      "Ban 2": 1,
      "Ban 3": 2,
      "Ban 4": 3,
      "Ban 5": 4,
      "Ban 6": 5,
      "Pick 1": 0,
      "Pick 2": 1,
      "Pick 3": 2,
      "Pick 4": 3,
      "Pick 5": 4,
      "Pick 6": 5,
      "Pick 7": 6,
      "Pick 8": 7,
      "Pick 9": 8,
      "Pick 10": 9,
    };
    return map[slot] ?? 0;
  }

}