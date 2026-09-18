export function createPersistenceUiController({ service, view }) {
  async function createFamily({ principal, displayName }) {
    view.setSaving(true);
    try {
      const result = await service.createFamily(principal, displayName);
      if (result.ok) {
        view.showFamily(result.data.family);
      } else {
        view.showError(result.error);
      }
      return result;
    } finally {
      view.setSaving(false);
    }
  }

  async function addStudent({ principal, familyId, childDisplayName }) {
    view.setSaving(true);
    try {
      const result = await service.addStudent(
        principal,
        familyId,
        childDisplayName,
      );
      if (result.ok) {
        view.showStudent?.(result.data.student);
      } else {
        view.showError(result.error);
      }
      return result;
    } finally {
      view.setSaving(false);
    }
  }

  return { createFamily, addStudent };
}
