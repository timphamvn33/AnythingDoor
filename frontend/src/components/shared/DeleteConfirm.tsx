import type { Store } from '@/types/store.types';
import {
  AlertDialogContent,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

interface DeleteConfirmProps {
  storeToDelete: Store | null;
  setStoreToDelete: (store: Store | null) => void;
  handleDeleteConfirmed: () => void;
}
export default function DeleteConfirm({
  storeToDelete,
  setStoreToDelete,
  handleDeleteConfirmed,
}: DeleteConfirmProps) {
  return (
    <>
      <AlertDialog open={!!storeToDelete} onOpenChange={() => setStoreToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the store{' '}
              <strong>{storeToDelete?.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setStoreToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirmed}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
