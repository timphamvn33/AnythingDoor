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
  itemToDelete: any | null;
  setItemToDelete: (item: any | null) => void;
  handleDeleteConfirmed: () => void;
}
export default function DeleteConfirm({
  itemToDelete,
  setItemToDelete,
  handleDeleteConfirmed,
}: DeleteConfirmProps) {
  return (
    <>
      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the store{' '}
              <strong>{itemToDelete?.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirmed}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
