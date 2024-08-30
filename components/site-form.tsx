"use client"

import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useDebounceCallback } from "usehooks-ts";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { checkUrl } from "@/lib/wordpress";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Form, 
    FormControl, 
    FormField, 
    FormItem, 
    FormLabel, 
    FormMessage 
} from "@/components/ui/form";
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardFooter, 
    CardHeader, 
    CardTitle 
} from "@/components/ui/card";

import { 
    AppWindow, 
    CheckCircle, 
    Loader2, 
    XCircle 
} from "lucide-react"

const httpRegex = /^(http|https):/
const completeUrlRegex = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)$/

const FormSchema = z.object({
    name: z
        .string()
        .min(1, {
            message: "Please enter a name for your site."
        })
        .max(255, {
            message: "Name must be less than 255 characters."
        }),
    url: z
        .string()
        .min(1, {
            message: "Please enter a URL for your site."
        })
        .max(255, {
            message: "URL must be less than 255 characters."
        })
        .transform((val, ctx) => {
            let completeUrl = val;
            // Prepend https:// if the URL 
            // doesn't start with http:// or https:// 
            if (!httpRegex.test(completeUrl)) {
                completeUrl = `https://${completeUrl}`;
            }
            // If the URL is still invalid, display an error message
            // and pass the fatal flag to abort the validation process early
            // This prevents unnecessary requests to the server to check
            // if the URL is a WordPress site
            if (!completeUrlRegex.test(completeUrl)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    fatal: true,
                    message: "Please enter a valid URL",
                });
                return z.NEVER;
            }
            return completeUrl;
        })
        // This refinement checks if the URL is a WordPress site
        // It only runs if the URL is valid
        .refine(async (completeUrl) => 
            completeUrl && await checkUrl(completeUrl), { 
                message: "Uh oh! That doesn't look like a WordPress site.",
        })
});

export const SiteForm = () => {

    const [urlValue, setUrlValue] = useState<string>("");
    const [isTyping, setIsTyping] = useState<boolean>(false);
    
    // Debounce URL value with 500ms delay 
    const debounced = useDebounceCallback(setUrlValue, 500);

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            name: "",
            url: "",
        },
        mode: "onChange"
    });

    const {
        getFieldState,
        setValue,
        trigger,
        handleSubmit,
        clearErrors,
        unregister,
        control,
        formState,
        formState: {
            isValidating,
        }
    } = form;

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        fieldName: keyof z.infer<typeof FormSchema>
    ) => {
        // Extract the value from the target element
        const { value } = e.target;
        // Update the rendered value immediately, 
        // but don't trigger validation yet
        if (fieldName === "url") {
            setValue(fieldName, value, { shouldDirty: true, shouldValidate: false });
            setIsTyping(true);
            debounced(value);
        }
        if (fieldName === "name") {
            // Unregister the URL field to prevent validation
            // while the user is typing the site name
            unregister("url")
            setValue(fieldName, value, { shouldDirty: true, shouldValidate: true });
        }
    };

    // When the debounced urlValue changes, trigger validation
    useEffect(() => {
        // Don't trigger validation if the field is empty
        // Instead, clear any existing field errors
        urlValue ? trigger("url") : clearErrors("url");
        // When the urlValue changes, we know the user has stopped typing
        // due to debounce delay. Update state accordingly.
        setIsTyping(false);
    }, [urlValue])

    const onSubmit = (values: z.infer<typeof FormSchema>) => {
        console.log(values, "values")
    };

    const urlIsDirty = getFieldState("url", formState).isDirty;
    const urlInvalid = getFieldState("url", formState).invalid;

    return (
        <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)}>
                <Card className="w-[350px]">
                    <CardHeader>
                        <CardTitle>Create Your Website</CardTitle>
                        <CardDescription>Tell us about your new site to get started.</CardDescription>
                        <CardContent className="py-6 px-0 space-y-4">
                            <FormField 
                                control={control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input 
                                                {...field}
                                                onChange={(e) => handleChange(e, field.name)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField 
                                control={control}
                                name="url"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>URL</FormLabel>
                                        <FormControl>
                                            <div className="relative flex items-center">
                                                { ( !urlIsDirty && !isTyping ) && 
                                                    <AppWindow size={16} className="absolute left-2" />
                                                }
                                                { ( isValidating || isTyping ) && 
                                                    <Loader2 size={16} className="absolute left-2 animate-spin" />
                                                }
                                                { ( !isValidating && urlIsDirty && urlInvalid && !isTyping ) && 
                                                    <XCircle size={16} className="absolute left-2 text-red-500"/>
                                                }
                                                { ( !isValidating && urlIsDirty && !urlInvalid && !isTyping ) && 
                                                    <CheckCircle size={16} className="absolute left-2 text-green-500" />
                                                }
                                                <Input
                                                    {...field}
                                                    onChange={(e) => handleChange(e, field.name)}
                                                    className="pl-8"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                        <CardFooter className="justify-end py-0 px-0">
                            <Button>Get Started</Button>
                        </CardFooter>
                    </CardHeader>
                </Card>
            </form>
        </Form>
    )
}