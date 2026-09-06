// Kompatibilitaet fuer den historischen Pfad. Der produktive Fachworkflow liegt im
// Protokollmodul; neue Aufrufer importieren ihn dort direkt.
export {
  ProtokollMailFlow,
  ProtokollMailFlow as MailFlow,
} from "../../modules/protokoll/mail/ProtokollMailFlow.js";
