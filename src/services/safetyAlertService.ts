import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

export const ACTIVE_SOS_ALERT_ID = "active_sos";

export async function createOrActivateSosAlert(
  patientId: string,
  triggeredBy: "patient" | "caregiver"
): Promise<boolean> {
  if (!patientId) throw new Error("A patient ID is required to create an SOS alert.");

  const alertRef = doc(
    db,
    "patients",
    patientId,
    "safetyAlerts",
    ACTIVE_SOS_ALERT_ID
  );

  return runTransaction(db, async (transaction) => {
    const alertSnapshot = await transaction.get(alertRef);
    if (alertSnapshot.exists() && alertSnapshot.data().status === "active") {
      return false;
    }

    transaction.set(alertRef, {
      type: "SOS",
      title: "Emergency SOS",
      description: "An SOS safety alert was requested for this patient.",
      severity: "critical",
      status: "active",
      isResolved: false,
      triggeredBy,
      createdAt: serverTimestamp(),
      resolvedAt: null,
      resolvedBy: null,
    });

    return true;
  });
}

export async function resolveSosAlert(
  patientId: string,
  caregiverId: string
): Promise<void> {
  if (!patientId || !caregiverId) {
    throw new Error("Patient and caregiver IDs are required to resolve an SOS alert.");
  }

  const alertRef = doc(
    db,
    "patients",
    patientId,
    "safetyAlerts",
    ACTIVE_SOS_ALERT_ID
  );

  await runTransaction(db, async (transaction) => {
    const alertSnapshot = await transaction.get(alertRef);
    if (!alertSnapshot.exists() || alertSnapshot.data().status !== "active") return;

    transaction.update(alertRef, {
      status: "resolved",
      isResolved: true,
      resolvedAt: serverTimestamp(),
      resolvedBy: caregiverId,
    });
  });
}
